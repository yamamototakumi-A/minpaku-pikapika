const { PrismaClient } = require('@prisma/client');
const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { authenticateToken } = require('../middleware/auth');
const { uploadImage, deleteImage, getSignedUploadUrl, getSignedReadUrl, extractFilePath, toGcsUrl } = require('../config/storage');
const lineService = require('../services/lineService');
const { nowJst, toJst } = require('../utils/timezone');

const router = express.Router();
const prisma = new PrismaClient();

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Token verification endpoint
router.get('/verify', authenticateToken, (req, res) => {
  try {
    // If we reach here, the token is valid (authenticateToken middleware passed)
    res.json({ 
      status: 'valid', 
      user: req.user,
      message: 'Token is valid' 
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Validation middleware
const validateRegistration = [
  body('surname').trim().isLength({ min: 1 }).withMessage('姓は必須です'),
  body('mainName').trim().isLength({ min: 1 }).withMessage('名は必須です'),
  body('userId').trim().isLength({ min: 3 }).withMessage('ユーザーIDは3文字以上必要です'),
  body('password').isLength({ min: 8 }).withMessage('パスワードは8文字以上必要です'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('パスワードが一致しません');
    }
    return true;
  })
];

const validateCompanyRegistration = [
  body('companyId').trim().isLength({ min: 1 }).withMessage('会社IDは必須です'),
  body('role').isIn(['headquarter', 'branch']).withMessage('役職は本社または支社である必要があります'),
  body('address').trim().isLength({ min: 1 }).withMessage('住所は必須です'),
  body('password').isLength({ min: 8 }).withMessage('パスワードは8文字以上必要です'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('パスワードが一致しません');
    }
    return true;
  })
];

const validateIndividualRegistration = [
  body('surname').trim().isLength({ min: 1 }).withMessage('姓は必須です'),
  body('mainName').trim().isLength({ min: 1 }).withMessage('名は必須です'),
  body('companyId').trim().isLength({ min: 1 }).withMessage('会社IDは必須です'),
  body('role').isIn(['president', 'staff']).withMessage('役職は社長またはスタッフである必要があります'),
  body('userId').trim().isLength({ min: 3 }).withMessage('ユーザーIDは3文字以上必要です'),
  body('password').isLength({ min: 8 }).withMessage('パスワードは8文字以上必要です'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('パスワードが一致しません');
    }
    return true;
  })
];

const validateClientRegistration = [
  body('surname').trim().isLength({ min: 1 }).withMessage('姓は必須です'),
  body('mainName').trim().isLength({ min: 1 }).withMessage('名は必須です'),
  body('prefectureCity').trim().isLength({ min: 1 }).withMessage('都道府県は必須です'),
  body('addressDetail').trim().isLength({ min: 1 }).withMessage('住所（番地まで）は必須です'),
  body('facilityId').trim().isLength({ min: 1 }).withMessage('施設IDは必須です'),
  body('password').isLength({ min: 8 }).withMessage('パスワードは8文字以上必要です'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('パスワードが一致しません');
    }
    return true;
  })
];

// Get all registered companies (for individual registration and HQ dashboard)
router.get('/companies', async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      select: { id: true, companyId: true, role: true, address: true },
      orderBy: { companyId: 'asc' }
    });

    res.json({
      companies: companies.map(c => ({
        id: c.id,
        companyId: c.companyId,
        type: c.role === 'headquarter' ? '本社' : '支社',
        address: c.address
      }))
    });

  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

// Get facilities for a specific company (for HQ dashboard)
router.get('/companies/:companyId/facilities', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.params;
    
    // Find the company by companyId
    const company = await prisma.company.findUnique({
      where: { companyId: companyId }
    });
    
    if (!company) {
      return res.status(404).json({ error: '会社が見つかりません' });
    }

    // Get facilities for this company
    const facilities = await prisma.facility.findMany({
      where: { companyId: company.id },
      select: { 
        id: true, 
        facilityId: true, 
        name: true, 
        address: true,
        createdAt: true
      },
      orderBy: { id: 'asc' }
    });

    res.json({ 
      facilities: facilities.map(f => ({
        ...f,
        companyId: company.companyId,
        companyName: company.companyId
      }))
    });

  } catch (error) {
    console.error('Get company facilities error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});







// ===== FACILITIES AND RECORDS FOR BRANCH PRESIDENT =====
// Get facilities for the current branch/company
router.get('/facilities/branch', authenticateToken, async (req, res) => {
  try {
    // Require a company user
    if (req.user.userType !== 'company') {
      return res.status(403).json({ error: 'Company account required' });
    }

    // Determine the company id from JWT; fallback if missing
    let companyId = req.user.companyId;
    if (!companyId) {
      const dbUser = await prisma.user.findUnique({ where: { id: req.user.id }, select: { companyId: true } });
      companyId = dbUser?.companyId || null;
    }
    if (!companyId) return res.json({ facilities: [], branchName: '支店' });
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) return res.json({ facilities: [], branchName: '支店' });

    const facilities = await prisma.facility.findMany({
      where: { companyId: company.id },
      select: { id: true, facilityId: true, name: true, address: true },
      orderBy: { id: 'asc' }
    });

    // Attach a branchName for display (use companyId or address)
    const facilitiesWithBranch = facilities.map(f => ({
      ...f,
      branchName: company.companyId || '支店'
    }));

    res.json({ facilities: facilitiesWithBranch });
  } catch (e) {
    console.error('facilities/branch error', e);
    res.status(500).json({ error: 'Failed to fetch facilities' });
  }
});







// Company-side registration (HQ President, Branch President, Staff)
router.post('/register/company', validateIndividualRegistration, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { surname, mainName, companyId, role, userId, password, lineUserId } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { userId } });
    if (existingUser) {
      return res.status(400).json({ error: 'このユーザーIDは既に使用されています' });
    }

    // Check if company exists
    const existingCompany = await prisma.company.findUnique({ where: { companyId } });
    if (!existingCompany) {
      return res.status(400).json({ error: '指定された会社IDが存在しません' });
    }

    // Check if trying to register as president and president already exists for this company
    if (role === 'president') {
      const existingPresident = await prisma.user.findFirst({
        where: { role: 'president', company: { companyId } }
      });
      if (existingPresident) {
        return res.status(400).json({ 
          error: 'この会社には既に社長が登録されています。各会社には1人の社長しか登録できません。スタッフとして登録してください。' 
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user (no address for individual registration)
    const newUser = await prisma.user.create({
      data: {
        surname,
        mainName,
        role,
        userId,
        passwordHash: hashedPassword,
        userType: 'company',
        lineUserId: lineUserId || null,
        company: { connect: { id: existingCompany.id } }
      },
      select: { id: true, surname: true, mainName: true, companyId: true, role: true, userId: true, lineUserId: true }
    });

    res.status(201).json({
      message: '登録が完了しました',
      user: {
        id: newUser.id,
        surname: newUser.surname,
        main_name: newUser.mainName,
        company_id: newUser.companyId,
        role: newUser.role,
        user_id: newUser.userId,
        line_user_id: newUser.lineUserId
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

// Client registration
router.post('/register/client', validateClientRegistration, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { surname, mainName, prefectureCity, addressDetail, facilityId, password, lineUserId } = req.body;

    // Check if facility already exists
    const existingUser = await prisma.user.findFirst({ 
      where: { 
        facilityId: facilityId,
        userType: 'client'
      } 
    });
    if (existingUser) {
      return res.status(400).json({ error: 'この施設IDは既に登録されています' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create facility record first
    const newFacility = await prisma.facility.create({
      data: {
        facilityId: facilityId,
        name: `${surname} ${mainName}`,
        address: `${prefectureCity} ${addressDetail}`,
        // Clients don't belong to companies, so no company relation
      },
      select: { id: true, facilityId: true }
    });

    // Create client user
    const newUser = await prisma.user.create({
      data: {
        surname,
        mainName,
        prefectureCity,
        addressDetail,
        userId: `client_${facilityId}`, // Generate unique userId for client
        passwordHash: hashedPassword,
        facilityId: facilityId,
        userType: 'client',
        lineUserId: lineUserId || null,
      },
      select: { id: true, userId: true, facilityId: true, lineUserId: true, surname: true, mainName: true, prefectureCity: true, addressDetail: true }
    });

    res.status(201).json({ 
      message: 'クライアント登録が完了しました', 
      user: newUser,
      facility: newFacility
    });

  } catch (error) {
    console.error('Client registration error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

// Company registration
router.post('/register/company-info', validateCompanyRegistration, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { companyId, role, address, password } = req.body;

    // Check if company already exists
    const existingCompany = await prisma.company.findUnique({ where: { companyId } });
    if (existingCompany) {
      return res.status(400).json({ error: 'この会社IDは既に使用されています' });
    }

    // Check if trying to register as HQ and HQ already exists
    if (role === 'headquarter') {
      const existingHQ = await prisma.company.findFirst({ where: { role: 'headquarter' } });
      if (existingHQ) {
        return res.status(400).json({ 
          error: '本社は既に存在します。本社は1つしか登録できません。支社として登録してください。' 
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create company
    const newCompany = await prisma.company.create({
      data: { 
        companyId, 
        role, 
        address, 
        passwordHash: hashedPassword,
      },
      select: { id: true, companyId: true, role: true, address: true }
    });
    res.status(201).json({ message: '会社登録が完了しました', company: newCompany });

  } catch (error) {
    console.error('Company registration error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

// Login
router.post('/login', [
  body('password').notEmpty().withMessage('パスワードは必須です')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, facilityId, password } = req.body;

    // Validate that either userId or facilityId is provided
    if (!userId && !facilityId) {
      return res.status(400).json({ error: 'ユーザーIDまたは施設IDは必須です' });
    }

    let user;
    
    if (facilityId) {
      // Login with facilityId (for clients)
      user = await prisma.user.findFirst({
        where: { 
          facilityId: facilityId,
          userType: 'client'
        },
        include: { company: true }
      });
    } else {
      // Login with userId (for company users)
      user = await prisma.user.findUnique({
        where: { userId },
        include: { company: true }
      });
    }

    if (!user) {
      return res.status(401).json({ error: 'ユーザーIDまたはパスワードが正しくありません' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'ユーザーIDまたはパスワードが正しくありません' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        userId: user.userId,
        role: user.role,
        userType: user.userType,
        companyId: user.companyId,
        facilityId: user.facilityId
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Provide company role and an effectiveRole to simplify frontend routing
    const companyRole = user?.company?.role || null;
    let effectiveRole = null;
    if (user.userType === 'company') {
      if (user.role === 'president') {
        effectiveRole = companyRole === 'headquarter' ? 'hq-president' : 'branch-president';
      } else if (user.role === 'staff') {
        effectiveRole = 'staff';
      }
    } else if (user.userType === 'client') {
      effectiveRole = 'client';
    }

    const responseData = {
      message: 'ログインが完了しました',
      token,
      user: {
        id: user.id,
        userId: user.userId,
        surname: user.surname,
        mainName: user.mainName,
        role: user.role,
        userType: user.userType,
        companyId: user.companyId,
        facilityId: user.facilityId,
        address: user.address || user?.company?.address || null,
        companyRole,
        line_user_id: user.lineUserId
      },
      effectiveRole
    };
    
    console.log('🔍 Sending login response:', JSON.stringify(responseData));
    res.json(responseData);

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

// Change password
router.post('/change-password', authenticateToken, [
  body('currentPassword').notEmpty().withMessage('現在のパスワードは必須です'),
  body('newPassword').isLength({ min: 8 }).withMessage('新しいパスワードは8文字以上必要です'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('新しいパスワードが一致しません');
    }
    return true;
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    // Get current user
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      return res.status(400).json({ error: '現在のパスワードが正しくありません' });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash: hashedNewPassword } });

    res.json({ message: 'パスワードが正常に変更されました' });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

// Change user ID
router.post('/change-user-id', authenticateToken, [
  body('currentUserId').notEmpty().withMessage('現在のユーザーIDは必須です'),
  body('currentPassword').notEmpty().withMessage('現在のパスワードは必須です'),
  body('newUserId').isLength({ min: 3 }).withMessage('新しいユーザーIDは3文字以上必要です'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentUserId, currentPassword, newUserId } = req.body;

    // Get current user
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    // Verify current user ID
    if (user.userId !== currentUserId) {
      return res.status(400).json({ error: '現在のユーザーIDが正しくありません' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      return res.status(400).json({ error: '現在のパスワードが正しくありません' });
    }

    // Check if new user ID already exists
    const existingUser = await prisma.user.findFirst({ where: { userId: newUserId, NOT: { id: req.user.id } } });
    if (existingUser) {
      return res.status(400).json({ error: 'このユーザーIDは既に使用されています' });
    }

    // Update user ID
    await prisma.user.update({ where: { id: req.user.id }, data: { userId: newUserId } });

    res.json({ message: 'ユーザーIDが正常に変更されました' });

  } catch (error) {
    console.error('Change user ID error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

// Update security settings (both user ID and password)
router.post('/update-security', authenticateToken, [
  body('currentUserId').notEmpty().withMessage('現在のユーザーIDは必須です'),
  body('currentPassword').notEmpty().withMessage('現在のパスワードは必須です'),
  body('newUserId').optional().isLength({ min: 3 }).withMessage('新しいユーザーIDは3文字以上必要です'),
  body('newPassword').optional().isLength({ min: 8 }).withMessage('新しいパスワードは8文字以上必要です'),
  body('confirmPassword').optional().custom((value, { req }) => {
    if (req.body.newPassword && value !== req.body.newPassword) {
      throw new Error('新しいパスワードが一致しません');
    }
    return true;
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentUserId, currentPassword, newUserId, newPassword } = req.body;

    // Get current user
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    // Verify current user ID
    if (user.userId !== currentUserId) {
      return res.status(400).json({ error: '現在のユーザーIDが正しくありません' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      return res.status(400).json({ error: '現在のパスワードが正しくありません' });
    }

    // Update user ID if provided
    if (newUserId && newUserId !== currentUserId) {
      // Check if new user ID already exists
      const existingUser = await prisma.user.findFirst({ where: { userId: newUserId, NOT: { id: req.user.id } } });
      if (existingUser) {
        return res.status(400).json({ error: 'このユーザーIDは既に使用されています' });
      }

      await prisma.user.update({ where: { id: req.user.id }, data: { userId: newUserId } });
    }

    // Update password if provided
    if (newPassword) {
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash: hashedNewPassword } });
    }

    res.json({ message: 'セキュリティ設定が正常に更新されました' });

  } catch (error) {
    console.error('Update security error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

// Verify credentials (for security settings)
router.post('/verify-credentials', authenticateToken, [
  body('currentUserId').notEmpty().withMessage('現在のユーザーIDは必須です'),
  body('currentPassword').notEmpty().withMessage('現在のパスワードは必須です')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentUserId, currentPassword } = req.body;

    // Get current user
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    // Verify current user ID
    if (user.userId !== currentUserId) {
      return res.status(400).json({ error: '現在のユーザーIDが正しくありません' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      return res.status(400).json({ error: '現在のパスワードが正しくありません' });
    }

    res.json({ message: '認証が完了しました' });

  } catch (error) {
    console.error('Verify credentials error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

// Get company info by company ID
router.get('/company-info/:companyId', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.params;
    
    const company = await prisma.company.findUnique({ where: { companyId } });
    if (!company) {
      return res.status(404).json({ error: '会社が見つかりません' });
    }
    res.json({
      company: {
        id: company.id,
        companyId: company.companyId,
        role: company.role,
        address: company.address
      }
    });

  } catch (error) {
    console.error('Get company info error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

// Get current user info
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, include: { company: true } });
    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }
    res.json({
      user: {
        id: user.id,
        userId: user.userId,
        surname: user.surname,
        mainName: user.mainName,
        role: user.role,
        userType: user.userType,
        companyId: user.companyId,
        address: user.address || user.company?.address || null,
        line_user_id: user.lineUserId
      }
    });

  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

// ===== CLEANING GUIDELINES ROUTES =====

// Get cleaning guidelines for a specific room type
router.get('/guidelines/:roomType', authenticateToken, async (req, res) => {
  try {
    const { roomType } = req.params;
    
    const guidelines = await prisma.cleaningGuideline.findMany({
      where: { roomType },
      orderBy: { stepNumber: 'asc' }
    });
    res.json({ roomType, guidelines });

  } catch (error) {
    console.error('Get guidelines error:', error);
    res.status(500).json({ error: 'ガイドラインの取得に失敗しました' });
  }
});

// Get all available room types with guidelines
router.get('/guidelines', authenticateToken, async (req, res) => {
  try {
    const roomTypes = await prisma.cleaningGuideline.findMany({
      distinct: ['roomType'],
      select: { roomType: true },
      orderBy: { roomType: 'asc' }
    });
    res.json({ roomTypes: roomTypes.map(r => r.roomType) });

  } catch (error) {
    console.error('Get room types error:', error);
    res.status(500).json({ error: '部屋タイプの取得に失敗しました' });
  }
});

// Add new cleaning guideline (Admin only)
router.post('/guidelines', authenticateToken, async (req, res) => {
  try {
    const { roomType, stepNumber, title, description, guidelineImageUrl } = req.body;

    // Validate required fields
    if (!roomType || !stepNumber || !guidelineImageUrl) {
      return res.status(400).json({ error: '部屋タイプ、ステップ番号、画像URLは必須です' });
    }

    const guideline = await prisma.cleaningGuideline.create({
      data: { roomType, stepNumber, title, description, guidelineImageUrl }
    });
    res.status(201).json({ message: 'ガイドラインが正常に追加されました', guideline });

  } catch (error) {
    console.error('Add guideline error:', error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({ error: 'この部屋タイプとステップ番号の組み合わせは既に存在します' });
    } else {
      res.status(500).json({ error: 'ガイドラインの追加に失敗しました' });
    }
  }
});

// Update cleaning guideline (Admin only)
router.put('/guidelines/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { roomType, stepNumber, title, description, guidelineImageUrl } = req.body;

    const guideline = await prisma.cleaningGuideline.update({
      where: { id: Number(id) },
      data: { roomType, stepNumber, title, description, guidelineImageUrl }
    });

    if (!guideline) {
      return res.status(404).json({ error: 'ガイドラインが見つかりません' });
    }

    res.json({ message: 'ガイドラインが正常に更新されました', guideline });

  } catch (error) {
    console.error('Update guideline error:', error);
    res.status(500).json({ error: 'ガイドラインの更新に失敗しました' });
  }
});

// Delete cleaning guideline (Admin only)
router.delete('/guidelines/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await prisma.cleaningGuideline.delete({ where: { id: Number(id) } });
    if (!deleted) {
      return res.status(404).json({ error: 'ガイドラインが見つかりません' });
    }

    res.json({ message: 'ガイドラインが正常に削除されました', guideline: deleted });

  } catch (error) {
    console.error('Delete guideline error:', error);
    res.status(500).json({ error: 'ガイドラインの削除に失敗しました' });
  }
});

// Upload cleaning image (direct upload with new folder structure)
router.post('/cleaning-images/upload', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { facilityId, recordId, roomType, beforeAfter } = req.body;
    const user = req.user;
    
    if (!req.file) {
      return res.status(400).json({ error: '画像ファイルが必要です' });
    }
    
    if (!facilityId || !roomType || !beforeAfter) {
      return res.status(400).json({ error: 'facilityId, roomType, beforeAfter は必須です' });
    }

    // Check file type (JPG, PNG only)
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'JPGまたはPNGファイルのみアップロード可能です' });
    }
    
    // Check file size (10MB)
    if (req.file.size > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'ファイルサイズは10MB以下である必要があります' });
    }

    // Generate new folder structure: clean company/{facilityId}/{year}/{month}/{date}/{roomType}/{beforeAfter}/
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const date = String(today.getDate()).padStart(2, '0');
    const folderPath = `clean company/${facilityId}/${year}/${month}/${date}/${roomType}/${beforeAfter}`;
    
    // Log upload details for debugging
    console.log(`📤 Uploading image: ${req.file.originalname} (${req.file.size} bytes) to ${folderPath}`);
    
    // Upload to GCS using the new structure
    // Pass the folder path and let uploadImage handle the filename generation
    const gcsUrl = await uploadImage(req.file.buffer, folderPath, req.file.mimetype);
    
    // Insert metadata into cleaning_images
    const createdImage = await prisma.cleaningImage.create({
      data: {
        companyId: user.companyId,
        facilityId: Number(facilityId),
        recordId: recordId ? Number(recordId) : null,
        roomType,
        beforeAfter,
        uploaderId: user.id,
        gcsUrl,
        uploadedAt: new Date(),
        updatedAt: new Date(),
      }
    });
    
    // Send LINE notifications
    try {
      await sendLineNotifications(createdImage, user);
    } catch (notificationError) {
      console.error('LINE notification error:', notificationError);
      // Don't fail the upload if notifications fail
    }
    
    res.json({ 
      success: true,
      message: '画像がアップロードされました', 
      image: {
        id: createdImage.id,
        gcsUrl: createdImage.gcsUrl,
        roomType: createdImage.roomType,
        beforeAfter: createdImage.beforeAfter,
        uploadedAt: createdImage.uploadedAt
      }
    });
    
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({ error: '画像のアップロードに失敗しました' });
  }
});

// Request signed upload URL with proper organization
router.post('/gcs/signed-upload', authenticateToken, async (req, res) => {
  try {
    const { facilityId, roomType, beforeAfter, contentType } = req.body;
    const user = req.user;
    
    if (!facilityId || !roomType || !beforeAfter || !contentType) {
      return res.status(400).json({ error: 'facilityId, roomType, beforeAfter and contentType are required' });
    }

    // Generate proper file path: clean company/{facilityId}/{year}/{month}/{date}/{roomType}/{beforeAfter}/{timestamp}-{random}.{ext}
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const date = String(today.getDate()).padStart(2, '0');
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8);
    const ext = contentType.split('/')[1] || 'bin';
    const fileName = `${timestamp}-${random}.${ext}`;
    const filePath = `clean company/${facilityId}/${year}/${month}/${date}/${roomType}/${beforeAfter}/${fileName}`;

    const uploadUrl = await getSignedUploadUrl(filePath, contentType, 15);
    const readUrl = toGcsUrl(filePath);

    return res.json({ uploadUrl, filePath, readUrl });
  } catch (e) {
    console.error('signed-upload error', e);
    res.status(500).json({ error: 'Failed to create signed URL' });
  }
});

// Confirm metadata after client uploaded via signed URL
router.post('/cleaning-images/confirm', authenticateToken, async (req, res) => {
  try {
    const { facilityId, recordId, roomType, beforeAfter, filePath } = req.body;
    const user = req.user;
    if (!facilityId || !recordId || !roomType || !beforeAfter || !filePath) {
      return res.status(400).json({ error: 'facilityId, recordId, roomType, beforeAfter, filePath are required' });
    }
    const gcsUrl = toGcsUrl(filePath);
    const created = await prisma.cleaningImage.create({
      data: {
        companyId: user.companyId,
        facilityId: Number(facilityId),
        recordId: Number(recordId),
        roomType,
        beforeAfter,
        uploaderId: user.id,
        gcsUrl,
        uploadedAt: new Date(),
        updatedAt: new Date(),
      },
    });
    return res.json({ message: 'confirmed', image: created });
  } catch (e) {
    console.error('confirm error', e);
    res.status(500).json({ error: 'Failed to confirm upload' });
  }
});

// Get a signed READ url for a filePath or gcsUrl
router.get('/gcs/signed-read', authenticateToken, async (req, res) => {
  try {
    const { filePathOrUrl, minutes } = req.query;
    if (!filePathOrUrl) return res.status(400).json({ error: 'filePathOrUrl is required' });
    const path = extractFilePath(String(filePathOrUrl));
    if (!path) return res.status(400).json({ error: 'Invalid filePathOrUrl' });
    const url = await getSignedReadUrl(path, Number(minutes) || 15);
    return res.json({ url });
  } catch (e) {
    console.error('signed-read error', e);
    res.status(500).json({ error: 'Failed to create signed read url' });
  }
});

// Find or create a cleaning record for given facility code, room type and date
router.post('/cleaning-records/find-or-create', authenticateToken, [
  body('facilityId').trim().notEmpty().withMessage('facilityId is required'),
  body('roomType').trim().notEmpty().withMessage('roomType is required'),
  body('cleaningDate').trim().notEmpty().withMessage('cleaningDate is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { facilityId, roomType, cleaningDate } = req.body;
    const user = req.user;

    // Find or create facility by facility_id (code)
    let facility = await prisma.facility.findUnique({ where: { facilityId } });
    let facilityDbId;
    if (!facility) {
      const created = await prisma.facility.create({
        data: { facilityId, companyId: user.companyId, name: null, address: null },
        select: { id: true }
      });
      facilityDbId = created.id;
    } else {
      facilityDbId = facility.id;
    }

    // Find existing cleaning record
    const existing = await prisma.cleaningRecord.findFirst({ where: { facilityId: facilityDbId, roomType, cleaningDate: new Date(cleaningDate) }, select: { id: true } });

    let recordId;
    if (existing) {
      recordId = existing.id;
    } else {
      const inserted = await prisma.cleaningRecord.create({
        data: {
          facilityId: facilityDbId,
          roomType,
          roomId: 0,
          cleaningDate: new Date(cleaningDate),
          beforeImages: [],
          afterImages: [],
          staffId: user.id,
          status: 'pending',
          notes: null
        },
        select: { id: true }
      });
      recordId = inserted.id;
    }

    return res.json({
      recordId,
      facilityDbId,
      companyId: user.companyId
    });
  } catch (error) {
    console.error('find-or-create record error:', error);
    res.status(500).json({ error: 'Failed to find or create cleaning record' });
  }
});

// Get cleaning images with proper organization and permissions
router.get('/cleaning-images', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const { facilityId, roomType, date, beforeAfter, companyId } = req.query;

    let whereClause = {};
    let includeClause = {
      facility: {
        select: {
          facilityId: true,
          name: true,
          address: true,
          company: {
            select: {
              companyId: true,
              role: true,
              address: true
            }
          }
        }
      },
      uploader: {
        select: {
          surname: true,
          mainName: true,
          userId: true,
          role: true
        }
      }
    };

    // Check if user is HQ president by getting their company info
    let isHQPresident = false;
    if (user.role === 'president' && user.companyId) {
      const userCompany = await prisma.company.findUnique({
        where: { id: user.companyId },
        select: { role: true }
      });
      isHQPresident = userCompany?.role === 'headquarter';
    }

    // Role-based filtering (president can optionally provide companyId in query, defaults to own)
    if (isHQPresident) {
      if (companyId) whereClause.companyId = parseInt(companyId);
    } else if (user.role === 'president') {
      whereClause.companyId = user.companyId;
    } else if (user.role === 'staff') {
      whereClause.uploaderId = user.id;
      whereClause.companyId = user.companyId;
    }

    // Apply filters if provided
    if (facilityId) whereClause.facilityId = parseInt(facilityId);
    if (roomType) whereClause.roomType = roomType;
    if (beforeAfter) whereClause.beforeAfter = beforeAfter;
    if (date) {
      const searchDate = new Date(date);
      whereClause.uploadedAt = {
        gte: searchDate,
        lt: new Date(searchDate.getTime() + 24 * 60 * 60 * 1000)
      };
    }

    const images = await prisma.cleaningImage.findMany({
      where: whereClause,
      include: includeClause,
      orderBy: [
        { facilityId: 'asc' },
        { uploadedAt: 'desc' },
        { roomType: 'asc' },
        { beforeAfter: 'asc' }
      ]
    });

    // Group images by facility/date/room/before-after
    const groupedImages = images.reduce((acc, image) => {
      const facilityKey = image.facility?.facilityId || 'unknown';
      const uploaded = image.uploadedAt;
      const dateKey = uploaded.toISOString().split('T')[0];
      const y = uploaded.getFullYear();
      const m = String(uploaded.getMonth() + 1).padStart(2, '0');
      const d = String(uploaded.getDate()).padStart(2, '0');
      const roomKey = image.roomType;
      const beforeAfterKey = image.beforeAfter;
      
      if (!acc[facilityKey]) acc[facilityKey] = {};
      if (!acc[facilityKey][dateKey]) acc[facilityKey][dateKey] = {};
      if (!acc[facilityKey][dateKey][roomKey]) acc[facilityKey][dateKey][roomKey] = {};
      if (!acc[facilityKey][dateKey][roomKey][beforeAfterKey]) {
        acc[facilityKey][dateKey][roomKey][beforeAfterKey] = [];
      }
      
      acc[facilityKey][dateKey][roomKey][beforeAfterKey].push({
        id: image.id,
        gcsUrl: image.gcsUrl,
        roomType: image.roomType,
        beforeAfter: image.beforeAfter,
        uploadedAt: image.uploadedAt,
        updatedAt: image.updatedAt,
        uploader: {
          id: image.uploader?.id,
          surname: image.uploader?.surname,
          mainName: image.uploader?.mainName,
          userId: image.uploader?.userId,
        },
        facility: image.facility
      });
      
      return acc;
    }, {});

    res.json({
      success: true,
      images: groupedImages,
      totalCount: images.length,
      userRole: user.role,
      userCompanyId: user.companyId
    });

  } catch (error) {
    console.error('Get cleaning images error:', error);
    res.status(500).json({ error: '画像の取得に失敗しました' });
  }
});

// Branch/company-wide hierarchical listing for presidents
router.get('/company/uploads/hierarchy', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    // Check if user is HQ president by getting their company info
    let isHQPresident = false;
    if (user.role === 'president' && user.companyId) {
      const userCompany = await prisma.company.findUnique({
        where: { id: user.companyId },
        select: { role: true }
      });
      isHQPresident = userCompany?.role === 'headquarter';
    }

    if (user.userType !== 'company' || (user.role !== 'president' && !isHQPresident)) {
      return res.status(403).json({ error: 'President access only' });
    }

    let filterCompanyId = user.companyId;
    
    // Handle companyId from query parameter
    if (req.query.companyId) {
      const queryCompanyId = req.query.companyId;
      
      // If it's a string (companyId like "BR-001"), find the company first
      if (isNaN(parseInt(queryCompanyId))) {
        const company = await prisma.company.findUnique({
          where: { companyId: queryCompanyId }
        });
        if (company) {
          filterCompanyId = company.id;
        }
      } else {
        // If it's a number, use it directly
        filterCompanyId = parseInt(queryCompanyId);
      }
    }
    
    const facilityCodeLike = req.query.facilityId ? String(req.query.facilityId) : null;

    console.log('=== HIERARCHY DEBUG ===');
    console.log('User:', { userType: user.userType, role: user.role, companyId: user.companyId });
    console.log('Query companyId:', req.query.companyId);
    console.log('Filter companyId:', filterCompanyId);
    console.log('Facility filter:', facilityCodeLike);
    console.log('========================');

    const images = await prisma.cleaningImage.findMany({
      where: {
        companyId: filterCompanyId,
        ...(facilityCodeLike ? { facility: { facilityId: { contains: facilityCodeLike } } } : {}),
      },
      include: {
        facility: { select: { id: true, facilityId: true, name: true } },
        uploader: { select: { id: true, surname: true, mainName: true, userId: true } },
      },
      orderBy: [{ uploadedAt: 'desc' }],
    });

    console.log('Found images:', images.length);

    const hierarchy = {};
    for (const img of images) {
      const fid = img.facility?.facilityId || 'unknown';
      const dt = img.uploadedAt;
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const d = String(dt.getDate()).padStart(2, '0');
      const room = img.roomType;
      const ba = img.beforeAfter;

      if (!hierarchy[fid]) hierarchy[fid] = { facilityId: fid, name: img.facility?.name || fid, years: {} };
      if (!hierarchy[fid].years[y]) hierarchy[fid].years[y] = {};
      if (!hierarchy[fid].years[y][m]) hierarchy[fid].years[y][m] = {};
      if (!hierarchy[fid].years[y][m][d]) hierarchy[fid].years[y][m][d] = {};
      if (!hierarchy[fid].years[y][m][d][room]) hierarchy[fid].years[y][m][d][room] = { before: [], after: [] };
      hierarchy[fid].years[y][m][d][room][ba].push({
        id: img.id,
        url: img.gcsUrl,
        uploadedAt: img.uploadedAt,
        uploader: img.uploader,
      });
    }

    res.json({ success: true, hierarchy });
  } catch (e) {
    console.error('company uploads hierarchy error', e);
    res.status(500).json({ error: 'Failed to fetch uploads hierarchy' });
  }
});

// Receipt endpoints
router.get('/facilities/:facilityId/receipts', authenticateToken, async (req, res) => {
  try {
    const { facilityId } = req.params;
    const receipts = await prisma.receiptImage.findMany({
      where: { facility: { facilityId } },
      orderBy: [{ uploadedAt: 'desc' }],
    });
    res.json({ success: true, receipts });
  } catch (e) {
    console.error('get receipts error', e);
    res.status(500).json({ error: 'Failed to fetch receipts' });
  }
});

router.post('/facilities/:facilityId/receipts', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { facilityId } = req.params;
    if (!req.file) return res.status(400).json({ error: '画像ファイルが必要です' });

    const facility = await prisma.facility.findUnique({ where: { facilityId } });
    if (!facility) return res.status(404).json({ error: '施設が見つかりません' });

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const folder = `receipts/${facilityId}/${year}/${String(month).padStart(2, '0')}`;
    const url = await uploadImage(req.file.buffer, folder, req.file.mimetype);

    const created = await prisma.receiptImage.create({
      data: {
        companyId: facility.companyId || req.user.companyId || null,
        facilityId: facility.id,
        uploaderId: req.user.id,
        gcsUrl: url,
        year,
        month,
      },
    });
    res.json({ success: true, receipt: created });
  } catch (e) {
    console.error('upload receipt error', e);
    res.status(500).json({ error: 'Failed to upload receipt' });
  }
});

// Delete a single receipt image with permission checks (HQ president: any, Branch president: own company, Staff: own uploads)
router.delete('/receipts/:id', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const receiptId = parseInt(req.params.id);
    if (!Number.isFinite(receiptId)) {
      return res.status(400).json({ error: '無効なレシートIDです' });
    }

    const receipt = await prisma.receiptImage.findFirst({
      where: { id: receiptId },
      include: {
        facility: { select: { companyId: true } },
        uploader: { select: { companyId: true } },
      },
    });

    if (!receipt) {
      return res.status(404).json({ error: 'レシートが見つかりません' });
    }

    // Determine owning company id with fallbacks
    const receiptCompanyId = receipt.companyId ?? receipt.facility?.companyId ?? receipt.uploader?.companyId ?? null;

    // Determine if user is HQ president
    let isHQPresident = false;
    if (user.role === 'president' && user.companyId) {
      const userCompany = await prisma.company.findUnique({ where: { id: user.companyId }, select: { role: true } });
      isHQPresident = userCompany?.role === 'headquarter';
    }

    const canDelete =
      isHQPresident ||
      (user.role === 'president' && receiptCompanyId !== null && user.companyId === receiptCompanyId) ||
      (user.role === 'staff' && user.id === receipt.uploaderId);

    if (!canDelete) {
      return res.status(403).json({ error: 'このレシートを削除する権限がありません' });
    }

    try {
      await deleteImage(receipt.gcsUrl);
    } catch (gcsError) {
      console.warn('GCS receipt deletion failed, continuing:', gcsError?.message || gcsError);
    }

    await prisma.receiptImage.delete({ where: { id: receiptId } });
    res.json({ success: true, message: 'レシートが削除されました' });
  } catch (error) {
    console.error('Delete receipt error:', error);
    res.status(500).json({ error: 'レシートの削除に失敗しました' });
  }
});

// Batch delete receipts by IDs
router.post('/receipts/batch-delete', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const { receiptIds } = req.body;
    if (!Array.isArray(receiptIds) || receiptIds.length === 0) {
      return res.status(400).json({ error: 'レシートIDの配列が必要です' });
    }

    const ids = receiptIds.map((n) => parseInt(n)).filter((n) => Number.isFinite(n));
    if (ids.length === 0) {
      return res.status(400).json({ error: '有効なレシートIDがありません' });
    }

    const receipts = await prisma.receiptImage.findMany({
      where: { id: { in: ids } },
      include: {
        facility: { select: { companyId: true } },
        uploader: { select: { companyId: true } },
      },
    });

    if (receipts.length !== ids.length) {
      const found = receipts.map((r) => r.id);
      const missing = ids.filter((id) => !found.includes(id));
      return res.status(404).json({ error: '一部のレシートが見つかりません', missingIds: missing, requestedIds: ids, foundIds: found });
    }

    // HQ president detection
    let isHQPresident = false;
    if (user.role === 'president' && user.companyId) {
      const userCompany = await prisma.company.findUnique({ where: { id: user.companyId }, select: { role: true } });
      isHQPresident = userCompany?.role === 'headquarter';
    }

    const unauthorized = receipts.filter((r) => {
      const receiptCompanyId = r.companyId ?? r.facility?.companyId ?? r.uploader?.companyId ?? null;
      if (isHQPresident) return false;
      if (user.role === 'president' && receiptCompanyId !== null && user.companyId === receiptCompanyId) return false;
      if (user.role === 'staff' && user.id === r.uploaderId) return false;
      return true;
    });

    if (unauthorized.length > 0) {
      return res.status(403).json({ error: `${unauthorized.length}件のレシートを削除する権限がありません`, unauthorizedIds: unauthorized.map((r) => r.id) });
    }

    await Promise.all(
      receipts.map(async (r) => {
        try {
          await deleteImage(r.gcsUrl);
        } catch (gcsError) {
          console.warn(`GCS deletion failed for receipt ${r.id}:`, gcsError?.message || gcsError);
        }
        return prisma.receiptImage.delete({ where: { id: r.id } });
      })
    );

    res.json({ success: true, message: `${receipts.length}件のレシートを削除しました`, deletedCount: receipts.length });
  } catch (error) {
    console.error('Batch delete receipts error:', error);
    res.status(500).json({ error: 'レシートの一括削除に失敗しました' });
  }
});


// Get cleaning images tree structure for navigation
router.get('/cleaning-images/tree', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    let whereClause = {};
    if (user.role === 'president') {
      whereClause.companyId = user.companyId;
    } else if (user.role === 'staff') {
      whereClause.uploaderId = user.id;
    }

    const images = await prisma.cleaningImage.findMany({
      where: whereClause,
      include: {
        facility: {
      select: {
            facilityId: true,
            name: true,
            company: {
              select: {
                companyId: true,
                role: true,
                address: true
              }
            }
          }
        }
      },
      orderBy: [
        { facilityId: 'asc' },
        { uploadedAt: 'desc' }
      ]
    });

    // Create tree structure: Company -> Facility -> Year/Month -> Date -> Room -> Before/After
    const tree = {};
    
    images.forEach(image => {
      const companyId = image.facility?.company?.companyId || 'unknown';
      const facilityId = image.facility?.facilityId || 'unknown';
      const date = image.uploadedAt;
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const roomType = image.roomType;
      const beforeAfter = image.beforeAfter;
      
      if (!tree[companyId]) {
        tree[companyId] = {
          companyId,
          address: image.facility?.company?.address || '',
          facilities: {}
        };
      }
      
      if (!tree[companyId].facilities[facilityId]) {
        tree[companyId].facilities[facilityId] = {
          facilityId,
          name: image.facility?.name || '',
          dates: {}
        };
      }
      
      if (!tree[companyId].facilities[facilityId].dates[`${year}-${month.toString().padStart(2, '0')}`]) {
        tree[companyId].facilities[facilityId].dates[`${year}-${month.toString().padStart(2, '0')}`] = {};
      }
      
      if (!tree[companyId].facilities[facilityId].dates[`${year}-${month.toString().padStart(2, '0')}`][day]) {
        tree[companyId].facilities[facilityId].dates[`${year}-${month.toString().padStart(2, '0')}`][day] = {};
      }
      
      if (!tree[companyId].facilities[facilityId].dates[`${year}-${month.toString().padStart(2, '0')}`][day][roomType]) {
        tree[companyId].facilities[facilityId].dates[`${year}-${month.toString().padStart(2, '0')}`][day][roomType] = {};
      }
      
      if (!tree[companyId].facilities[facilityId].dates[`${year}-${month.toString().padStart(2, '0')}`][day][roomType][beforeAfter]) {
        tree[companyId].facilities[facilityId].dates[`${year}-${month.toString().padStart(2, '0')}`][day][roomType][beforeAfter] = [];
      }
      
      tree[companyId].facilities[facilityId].dates[`${year}-${month.toString().padStart(2, '0')}`][day][roomType][beforeAfter].push({
        id: image.id,
        gcsUrl: image.gcsUrl,
        uploadedAt: image.uploadedAt,
        updatedAt: image.updatedAt
      });
    });

    res.json({
      success: true,
      tree,
      userRole: user.role
    });

  } catch (error) {
    console.error('Get cleaning images tree error:', error);
    res.status(500).json({ error: '画像ツリーの取得に失敗しました' });
  }
});

// Delete cleaning image
router.delete('/cleaning-images/:id', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const rawId = req.params.id;
    
    if (!rawId) {
      return res.status(400).json({ error: '画像IDが必要です' });
    }
    
    let imageId = Number(rawId);
    if (!Number.isFinite(imageId)) {
      // fallback to parseInt
      imageId = parseInt(rawId);
    }
    
    if (!Number.isFinite(imageId)) {
      return res.status(400).json({ error: '無効な画像IDです' });
    }

    // Get the image to check permissions
    const image = await prisma.cleaningImage.findFirst({
      where: { id: imageId },
      include: {
        facility: {
          include: {
            company: true
          }
        },
        uploader: true
      }
    });

    if (!image) {
      return res.status(404).json({ error: '画像が見つかりません' });
    }

    // Check if user is HQ president by getting their company info
    let isHQPresident = false;
    if (user.role === 'president' && user.companyId) {
      const userCompany = await prisma.company.findUnique({
        where: { id: user.companyId },
        select: { role: true }
      });
      isHQPresident = userCompany?.role === 'headquarter';
    }

    // Determine the company that owns the image using multiple fallbacks
    const imageCompanyId = image.companyId ?? image?.facility?.companyId ?? image?.uploader?.companyId ?? null;

    // Check permissions (robust for legacy rows where facilityId/companyId may be null)
    const canDelete =
      isHQPresident || // HQ president can delete anything
      (user.role === 'president' && imageCompanyId !== null && user.companyId === imageCompanyId) || // Branch president can delete images from their company
      (user.role === 'staff' && user.id === image.uploaderId); // Staff can delete their own images

    if (!canDelete) {
      return res.status(403).json({ error: 'この画像を削除する権限がありません' });
    }

    // Delete from GCS
    try {
      await deleteImage(image.gcsUrl);
    } catch (gcsError) {
      console.warn('GCS deletion failed, but continuing with DB deletion:', gcsError);
    }

    // Delete from database
    await prisma.cleaningImage.delete({
      where: { id: imageId }
    });

    res.json({ success: true, message: '画像が削除されました' });

  } catch (error) {
    console.error('Delete cleaning image error:', error);
    res.status(500).json({ error: '画像の削除に失敗しました' });
  }
});

// Batch delete cleaning images with permission check
router.delete('/cleaning-images/batch', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const { imageIds } = req.body;

    console.log('=== BATCH DELETE DEBUG ===');
    console.log('User data:', {
      id: user.id,
      userId: user.userId,
      role: user.role,
      userType: user.userType,
      companyId: user.companyId,
      facilityId: user.facilityId
    });
    console.log('Request body:', { imageIds });
    console.log('========================');

    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      return res.status(400).json({ error: '画像IDの配列が必要です' });
    }

    // Normalize ids to integers, filter out NaN
    const normalizedIds = imageIds
      .map((id) => parseInt(id))
      .filter((id) => Number.isFinite(id));

    if (normalizedIds.length === 0) {
      return res.status(400).json({ error: '有効な画像IDがありません' });
    }

    console.log('Normalized IDs:', normalizedIds);

    // Get all images to check permissions
    const images = await prisma.cleaningImage.findMany({
      where: { id: { in: normalizedIds } },
      include: {
        // We prefer companyId on the image row, but include facility for fallback/context
        facility: { select: { id: true, companyId: true } },
        uploader: { select: { id: true } },
      },
    });

    console.log('Found images:', images.length, 'out of', normalizedIds.length);

    if (images.length !== normalizedIds.length) {
      const foundIds = images.map(img => img.id);
      const missingIds = normalizedIds.filter(id => !foundIds.includes(id));
      return res.status(404).json({ 
        error: `一部の画像が見つかりません`, 
        missingIds,
        requestedIds: normalizedIds,
        foundIds
      });
    }

    // First, check if user is HQ president by getting their company info
    let isHQPresident = false;
    if (user.role === 'president' && user.companyId) {
      const userCompany = await prisma.company.findUnique({
        where: { id: user.companyId },
        select: { role: true }
      });
      isHQPresident = userCompany?.role === 'headquarter';
    }

    // Check permissions for all images (use image.companyId fallback to facility?.companyId)
    const unauthorizedImages = images.filter((image) => {
      const imageCompanyId = image.companyId ?? image.facility?.companyId ?? null;
      
      let canDelete = false;
      
      if (isHQPresident) {
        // HQ President can delete ANY image regardless of company
        canDelete = true;
      } else if (user.role === 'president' && imageCompanyId !== null && user.companyId === imageCompanyId) {
        // Branch president can delete images from their own company
        canDelete = true;
      } else if (user.role === 'staff' && user.id === image.uploaderId) {
        // Staff can delete their own images
        canDelete = true;
      }
      
      console.log(`Image ${image.id} permission check:`, {
        userRole: user.role,
        userCompanyId: user.companyId,
        imageCompanyId,
        canDelete,
        isHQ: isHQPresident
      });
      
      return !canDelete;
    });

    if (unauthorizedImages.length > 0) {
      return res.status(403).json({ 
        error: `${unauthorizedImages.length}枚の画像を削除する権限がありません`,
        unauthorizedImageIds: unauthorizedImages.map(img => img.id)
      });
    }

    console.log('All images authorized for deletion, proceeding...');

    // Delete from GCS and database
    const deletePromises = images.map(async (image) => {
      try {
        await deleteImage(image.gcsUrl);
      } catch (gcsError) {
        console.warn(`GCS deletion failed for image ${image.id}:`, gcsError?.message || gcsError);
      }
      return prisma.cleaningImage.delete({ where: { id: image.id } });
    });

    await Promise.all(deletePromises);

    console.log(`Successfully deleted ${images.length} images`);

    res.json({ success: true, message: `${images.length}枚の画像が削除されました`, deletedCount: images.length });
  } catch (error) {
    console.error('Batch delete cleaning images error:', error);
    res.status(500).json({ error: '画像の一括削除に失敗しました' });
  }
});

// Alternative batch delete endpoint using POST (for better compatibility)
router.post('/cleaning-images/batch-delete', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const { imageIds } = req.body;

    console.log('=== BATCH DELETE POST DEBUG ===');
    console.log('User data:', {
      id: user.id,
      userId: user.userId,
      role: user.role,
      userType: user.userType,
      companyId: user.companyId,
      facilityId: user.facilityId
    });
    console.log('Request body:', { imageIds });
    console.log('========================');

    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      return res.status(400).json({ error: '画像IDの配列が必要です' });
    }

    // Normalize ids to integers, filter out NaN
    const normalizedIds = imageIds
      .map((id) => parseInt(id))
      .filter((id) => Number.isFinite(id));

    if (normalizedIds.length === 0) {
      return res.status(400).json({ error: '有効な画像IDがありません' });
    }

    console.log('Normalized IDs:', normalizedIds);

    // Get all images to check permissions
    const images = await prisma.cleaningImage.findMany({
      where: { id: { in: normalizedIds } },
      include: {
        // We prefer companyId on the image row, but include facility for fallback/context
        facility: { select: { id: true, companyId: true } },
        uploader: { select: { id: true } },
      },
    });

    console.log('Found images:', images.length, 'out of', normalizedIds.length);

    if (images.length !== normalizedIds.length) {
      const foundIds = images.map(img => img.id);
      const missingIds = normalizedIds.filter(id => !foundIds.includes(id));
      return res.status(404).json({ 
        error: `一部の画像が見つかりません`, 
        missingIds,
        requestedIds: normalizedIds,
        foundIds
      });
    }

    // First, check if user is HQ president by getting their company info
    let isHQPresident = false;
    if (user.role === 'president' && user.companyId) {
      const userCompany = await prisma.company.findUnique({
        where: { id: user.companyId },
        select: { role: true }
      });
      isHQPresident = userCompany?.role === 'headquarter';
    }

    // Check permissions for all images (use image.companyId fallback to facility?.companyId)
    const unauthorizedImages = images.filter((image) => {
      const imageCompanyId = image.companyId ?? image.facility?.companyId ?? null;
      
      let canDelete = false;
      
      if (isHQPresident) {
        // HQ President can delete ANY image regardless of company
        canDelete = true;
      } else if (user.role === 'president' && imageCompanyId !== null && user.companyId === imageCompanyId) {
        // Branch president can delete images from their own company
        canDelete = true;
      } else if (user.role === 'staff' && user.id === image.uploaderId) {
        // Staff can delete their own images
        canDelete = true;
      }
      
      console.log(`Image ${image.id} permission check:`, {
        userRole: user.role,
        userCompanyId: user.companyId,
        imageCompanyId,
        canDelete,
        isHQ: isHQPresident
      });
      
      return !canDelete;
    });

    if (unauthorizedImages.length > 0) {
      return res.status(403).json({ 
        error: `${unauthorizedImages.length}枚の画像を削除する権限がありません`,
        unauthorizedImageIds: unauthorizedImages.map(img => img.id)
      });
    }

    console.log('All images authorized for deletion, proceeding...');

    // Delete from GCS and database
    const deletePromises = images.map(async (image) => {
      try {
        await deleteImage(image.gcsUrl);
      } catch (gcsError) {
        console.warn(`GCS deletion failed for image ${image.id}:`, gcsError?.message || gcsError);
      }
      return prisma.cleaningImage.delete({ where: { id: image.id } });
    });

    await Promise.all(deletePromises);

    console.log(`Successfully deleted ${images.length} images`);

    res.json({ success: true, message: `${images.length}枚の画像が削除されました`, deletedCount: images.length });
  } catch (error) {
    console.error('Batch delete cleaning images error:', error);
    res.status(500).json({ error: '画像の一括削除に失敗しました' });
  }
});

// Update/replace cleaning image with permission check
router.patch('/cleaning-images/:id', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const user = req.user;
    const imageId = parseInt(req.params.id);
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: '画像ファイルが必要です' });
    }

    // Check file type
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.mimetype)) {
      return res.status(400).json({ error: 'JPGまたはPNGファイルのみアップロード可能です' });
    }

    // Check file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'ファイルサイズは10MB以下である必要があります' });
    }

    // Get the image to check permissions
    const image = await prisma.cleaningImage.findUnique({
      where: { id: imageId },
      include: {
        facility: {
          include: {
            company: true
          }
        },
        uploader: true
      }
    });

    if (!image) {
      return res.status(404).json({ error: '画像が見つかりません' });
    }

    // Check if user is HQ president by getting their company info
    let isHQPresident = false;
    if (user.role === 'president' && user.companyId) {
      const userCompany = await prisma.company.findUnique({
        where: { id: user.companyId },
        select: { role: true }
      });
      isHQPresident = userCompany?.role === 'headquarter';
    }

    // Check permissions
    const canUpdate = 
      isHQPresident || // HQ president can update anything
      (user.role === 'president' && user.companyId === image.facility.companyId) || // Branch president can update from their company
      (user.role === 'staff' && user.id === image.uploaderId); // Staff can update their own images

    if (!canUpdate) {
      return res.status(403).json({ error: 'この画像を更新する権限がありません' });
    }

    // Generate new GCS path
    const uploadDate = image.uploadedAt;
    const year = uploadDate.getFullYear();
    const month = String(uploadDate.getMonth() + 1).padStart(2, '0');
    const date = String(uploadDate.getDate()).padStart(2, '0');
    const newFilePath = `clean company/${image.facility.facilityId}/${year}/${month}/${date}/${image.roomType}/${image.beforeAfter}/${Date.now()}-${file.originalname}`;
    
    // Upload new image to GCS
    const newGcsUrl = await uploadImage(file.buffer, newFilePath, file.mimetype);

    // Update database
    const updatedImage = await prisma.cleaningImage.update({
      where: { id: imageId },
      data: {
        gcsUrl: newGcsUrl,
        updatedAt: new Date()
      }
    });

    // Delete old image from GCS
    try {
      await deleteImage(image.gcsUrl);
    } catch (gcsError) {
      console.warn('Old image GCS deletion failed:', gcsError);
    }

    res.json({
      success: true,
      message: '画像が更新されました',
      image: updatedImage
    });

  } catch (error) {
    console.error('Update cleaning image error:', error);
    res.status(500).json({ error: '画像の更新に失敗しました' });
  }
});

// Get staff's own uploaded images organized by facility/date/room
router.get('/cleaning-images/staff-records', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    // Only allow staff users
    if (user.userType !== 'company' || user.role !== 'staff') {
      return res.status(403).json({ error: 'Staff access only' });
    }

    // Get all images uploaded by this staff member
    const images = await prisma.cleaningImage.findMany({
      where: {
        uploaderId: user.id,
        companyId: user.companyId
      },
      include: {
        facility: {
          select: {
            facilityId: true,
            name: true
          }
        }
      },
      orderBy: [
        { uploadedAt: 'desc' }
      ]
    });

    // Organize images by facility -> date -> room -> before/after
    const organizedRecords = {};
    
    images.forEach(image => {
      const facilityId = image.facility?.facilityId || 'Unknown';
      const uploadDate = new Date(image.uploadedAt).toISOString().split('T')[0]; // YYYY-MM-DD
      const roomType = image.roomType;
      const beforeAfter = image.beforeAfter;
      
      // Initialize facility if not exists
      if (!organizedRecords[facilityId]) {
        organizedRecords[facilityId] = {
          facilityId,
          facilityName: image.facility?.name || facilityId,
          dates: {}
        };
      }
      
      // Initialize date if not exists
      if (!organizedRecords[facilityId].dates[uploadDate]) {
        organizedRecords[facilityId].dates[uploadDate] = {
          rooms: {}
        };
      }
      
      // Initialize room if not exists
      if (!organizedRecords[facilityId].dates[uploadDate].rooms[roomType]) {
        organizedRecords[facilityId].dates[uploadDate].rooms[roomType] = {
          before: [],
          after: []
        };
      }
      
      // Add image to appropriate before/after array
      organizedRecords[facilityId].dates[uploadDate].rooms[roomType][beforeAfter].push({
        id: image.id,
        gcsUrl: image.gcsUrl,
        uploadedAt: image.uploadedAt,
        updatedAt: image.updatedAt
      });
    });

    // Convert to array format for frontend
    const recordsArray = Object.values(organizedRecords);
    
    res.json({
      success: true,
      records: recordsArray
    });

  } catch (error) {
    console.error('Get staff records error:', error);
    res.status(500).json({ error: 'Failed to fetch staff records' });
  }
});

// ===== CLIENT-SPECIFIC ROUTES =====

// Get client hierarchy (only for their facility)
router.get('/client/hierarchy', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    // Only allow client users
    if (user.userType !== 'client') {
      return res.status(403).json({ error: 'Client access only' });
    }

    // Extract facilityId from userId (temporary fix until database is updated)
    let facilityId = user.facilityId;
    if (!facilityId && user.userId && user.userId.startsWith('client_')) {
      facilityId = user.userId.replace('client_', '');
    }

    if (!facilityId) {
      return res.status(400).json({ error: 'Facility ID not found for this client' });
    }

    // Get all images for this specific facility
    const images = await prisma.cleaningImage.findMany({
      where: {
        facility: {
          facilityId: facilityId
        }
      },
      include: {
        facility: {
          select: {
            facilityId: true,
            name: true
          }
        }
      },
      orderBy: [
        { uploadedAt: 'desc' }
      ]
    });

    // Organize images by year -> month -> day -> room -> before/after
    const hierarchy = {};
    
    images.forEach(image => {
      const uploadDate = new Date(image.uploadedAt);
      const year = uploadDate.getFullYear().toString();
      const month = (uploadDate.getMonth() + 1).toString().padStart(2, '0');
      const day = uploadDate.getDate().toString().padStart(2, '0');
      const roomType = image.roomType;
      const beforeAfter = image.beforeAfter;
      
      // Initialize facility if not exists
      if (!hierarchy[facilityId]) {
        hierarchy[facilityId] = {
          name: image.facility?.name || facilityId,
          years: {}
        };
      }
      
      // Initialize year if not exists
      if (!hierarchy[facilityId].years[year]) {
        hierarchy[facilityId].years[year] = {};
      }
      
      // Initialize month if not exists
      if (!hierarchy[facilityId].years[year][month]) {
        hierarchy[facilityId].years[year][month] = {};
      }
      
      // Initialize day if not exists
      if (!hierarchy[facilityId].years[year][month][day]) {
        hierarchy[facilityId].years[year][month][day] = {};
      }
      
      // Initialize room if not exists
      if (!hierarchy[facilityId].years[year][month][day][roomType]) {
        hierarchy[facilityId].years[year][month][day][roomType] = {
          before: [],
          after: []
        };
      }
      
      // Add image to appropriate before/after array
      hierarchy[facilityId].years[year][month][day][roomType][beforeAfter].push({
        id: image.id,
        url: image.gcsUrl,
        uploadedAt: image.uploadedAt,
        updatedAt: image.updatedAt
      });
    });

    res.json({
      success: true,
      hierarchy,
      facilityId: facilityId,
      facilityName: hierarchy[facilityId]?.name || facilityId
    });

  } catch (error) {
    console.error('Get client hierarchy error:', error);
    res.status(500).json({ error: 'Failed to fetch client hierarchy' });
  }
});

// Get client receipts
router.get('/client/receipts', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    // Only allow client users
    if (user.userType !== 'client') {
      return res.status(403).json({ error: 'Client access only' });
    }

    // Extract facilityId from userId (temporary fix until database is updated)
    let facilityId = user.facilityId;
    if (!facilityId && user.userId && user.userId.startsWith('client_')) {
      facilityId = user.userId.replace('client_', '');
    }

    if (!facilityId) {
      return res.status(400).json({ error: 'Facility ID not found for this client' });
    }

    // Get all receipts for this specific facility
    const receipts = await prisma.receiptImage.findMany({
      where: {
        facility: {
          facilityId: facilityId
        }
      },
      orderBy: [
        { uploadedAt: 'desc' }
      ]
    });

    // Organize receipts by month (YYYY-MM format)
    const receiptsByMonth = {};
    
    receipts.forEach(receipt => {
      const uploadDate = new Date(receipt.uploadedAt);
      const monthKey = `${uploadDate.getFullYear()}-${(uploadDate.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!receiptsByMonth[monthKey]) {
        receiptsByMonth[monthKey] = [];
      }
      
      receiptsByMonth[monthKey].push(receipt.gcsUrl);
    });

    res.json({
      success: true,
      receipts: receiptsByMonth
    });

  } catch (error) {
    console.error('Get client receipts error:', error);
    res.status(500).json({ error: 'Failed to fetch client receipts' });
  }
});

// Upload client receipts
router.post('/client/receipts/upload', authenticateToken, upload.array('receipts', 10), async (req, res) => {
  try {
    const user = req.user;
    
    // Only allow client users
    if (user.userType !== 'client') {
      return res.status(403).json({ error: 'Client access only' });
    }

    // Extract facilityId from userId (temporary fix until database is updated)
    let facilityId = user.facilityId;
    if (!facilityId && user.userId && user.userId.startsWith('client_')) {
      facilityId = user.userId.replace('client_', '');
    }

    if (!facilityId) {
      return res.status(400).json({ error: 'Facility ID not found for this client' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Find the facility by facilityId
    const facility = await prisma.facility.findUnique({
      where: { facilityId: facilityId }
    });

    if (!facility) {
      return res.status(404).json({ error: 'Facility not found' });
    }

    const uploadedReceipts = [];

    for (const file of req.files) {
      try {
        // Upload to GCS
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const folder = `receipts/${facilityId}/${year}/${String(month).padStart(2, '0')}`;
        const gcsUrl = await uploadImage(file.buffer, folder, file.mimetype);
        
        // Save to database
        const receipt = await prisma.receiptImage.create({
          data: {
            companyId: facility.companyId || null,
            facilityId: facility.id,
            uploaderId: user.id,
            gcsUrl: gcsUrl,
            year: year,
            month: month
          }
        });

        uploadedReceipts.push(receipt);
      } catch (uploadError) {
        console.error('Receipt upload error:', uploadError);
        // Continue with other files even if one fails
      }
    }

    res.json({
      success: true,
      message: `${uploadedReceipts.length} receipts uploaded successfully`,
      receipts: uploadedReceipts
    });

  } catch (error) {
    console.error('Upload client receipts error:', error);
    res.status(500).json({ error: 'Failed to upload receipts' });
  }
});

// ===== CLEANING RECORDS ROUTES =====

// ===== LINE NOTIFICATION ENDPOINTS =====

// Update user's LINE user ID
router.post('/line/update-user-id', authenticateToken, [
  body('lineUserId').notEmpty().withMessage('LINE User ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { lineUserId } = req.body;
    const userId = req.user.id;

    // Validate LINE user ID format
    if (!lineService.validateLineUserId(lineUserId)) {
      return res.status(400).json({ error: 'Invalid LINE User ID format' });
    }

    // Update user's LINE user ID
    await prisma.user.update({
      where: { id: userId },
      data: { lineUserId }
    });

    res.json({ 
      success: true, 
      message: 'LINE User ID updated successfully',
      lineUserId 
    });

  } catch (error) {
    console.error('Update LINE User ID error:', error);
    res.status(500).json({ error: 'Failed to update LINE User ID' });
  }
});

// Get user's LINE user ID
router.get('/line/user-id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lineUserId: true }
    });

    res.json({ 
      success: true, 
      lineUserId: user?.lineUserId || null 
    });

  } catch (error) {
    console.error('Get LINE User ID error:', error);
    res.status(500).json({ error: 'Failed to get LINE User ID' });
  }
});

// Send test LINE notification
router.post('/line/test', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lineUserId: true, surname: true, mainName: true }
    });

    if (!user?.lineUserId) {
      return res.status(400).json({ error: 'LINE User ID not set. Please set your LINE User ID first.' });
    }

    const testMessage = `🧪 テスト通知

こんにちは！${user.surname || ''} ${user.mainName || ''}さん

これはLINE通知システムのテストメッセージです。
正常に受信できていることを確認してください。

送信時刻: ${new Date().toLocaleString('ja-JP')}`;

    const result = await lineService.sendMessageToUser(user.lineUserId, testMessage);

    if (result.success) {
      // Log the notification
      await prisma.lineNotification.create({
        data: {
          userId: userId,
          message: testMessage,
          status: 'sent'
        }
      });

      res.json({ 
        success: true, 
        message: 'Test notification sent successfully',
        result: result.data
      });
    } else {
      // Log the failed notification
      await prisma.lineNotification.create({
        data: {
          userId: userId,
          message: testMessage,
          status: 'failed',
          error: result.error
        }
      });

      res.status(400).json({ 
        success: false, 
        error: 'Failed to send test notification',
        details: result.error
      });
    }

  } catch (error) {
    console.error('Test LINE notification error:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

// Get LINE notification history
router.get('/line/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const notifications = await prisma.lineNotification.findMany({
      where: { userId },
      orderBy: { sentAt: 'desc' },
      take: 50
    });

    res.json({ 
      success: true, 
      notifications 
    });

  } catch (error) {
    console.error('Get LINE notification history error:', error);
    res.status(500).json({ error: 'Failed to get notification history' });
  }
});

// Helper function to send LINE notifications
async function sendLineNotifications(image, user) {
  try {
    // Get facility and company information
    const facility = await prisma.facility.findUnique({
      where: { id: image.facilityId },
      include: { company: true }
    });

    if (!facility) {
      console.error('Facility not found for LINE notification');
      return;
    }

    // Get staff information
    const staff = await prisma.user.findUnique({
      where: { id: user.id },
      select: { surname: true, mainName: true }
    });

    const staffName = `${staff?.surname || ''} ${staff?.mainName || ''}`.trim() || 'スタッフ';
    const facilityName = facility.name || facility.facilityId;
    const companyName = facility.company?.companyId || '会社';

    // Generate notification message
    const message = await lineService.sendReportNotification(
      facilityName,
      image.roomType,
      staffName,
      companyName,
      image.beforeAfter
    );

    // Get recipients based on beforeAfter status
    let recipients = [];

    if (image.beforeAfter === 'before') {
      // Before clean: notify company presidents and client
      recipients = await getBeforeCleanRecipients(facility);
    } else {
      // After clean: notify only company presidents
      recipients = await getAfterCleanRecipients(facility);
    }

    // Send notifications
    if (recipients.length > 0) {
      const results = await lineService.sendMessageToMultipleUsers(recipients, message);
      
      // Log notifications
      for (const result of results) {
        await prisma.lineNotification.create({
          data: {
            userId: user.id,
            message: message,
            status: result.success ? 'sent' : 'failed',
            error: result.success ? null : result.error
          }
        });
      }

      console.log(`LINE notifications sent: ${results.filter(r => r.success).length}/${results.length} successful`);
    } else {
      console.log('No LINE recipients found for notification');
    }

  } catch (error) {
    console.error('Error in sendLineNotifications:', error);
    throw error;
  }
}

// Helper function to get recipients for before clean notifications
async function getBeforeCleanRecipients(facility) {
  const recipients = [];

  // Get company presidents (including HQ president)
  const presidents = await prisma.user.findMany({
    where: {
      userType: 'company',
      role: 'president',
      companyId: facility.companyId,
      lineUserId: { not: null }
    },
    select: { lineUserId: true }
  });

  recipients.push(...presidents.map(p => p.lineUserId));

  // Get client for this facility
  const client = await prisma.user.findFirst({
    where: {
      userType: 'client',
      facilityId: facility.facilityId,
      lineUserId: { not: null }
    },
    select: { lineUserId: true }
  });

  if (client?.lineUserId) {
    recipients.push(client.lineUserId);
  }

  return recipients.filter(Boolean);
}

// Helper function to get recipients for after clean notifications
async function getAfterCleanRecipients(facility) {
  // Get company presidents (including HQ president)
  const presidents = await prisma.user.findMany({
    where: {
      userType: 'company',
      role: 'president',
      companyId: facility.companyId,
      lineUserId: { not: null }
    },
    select: { lineUserId: true }
  });

  return presidents.map(p => p.lineUserId).filter(Boolean);
}

// Get all facilities with client information for staff dashboard
router.get('/facilities', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    // Only allow staff users
    if (user.userType !== 'company' || user.role !== 'staff') {
      return res.status(403).json({ error: 'Staff access only' });
    }

    // Get ALL facilities (both company-owned and client-owned)
    const facilities = await prisma.facility.findMany({
      orderBy: {
        facilityId: 'asc'
      }
    });

    // Get client information for each facility
    const facilitiesWithClients = await Promise.all(facilities.map(async (facility) => {
      // Find client user for this facility
      const client = await prisma.user.findFirst({
        where: {
          userType: 'client',
          facilityId: facility.facilityId
        },
        select: {
          surname: true,
          mainName: true,
          prefectureCity: true,
          addressDetail: true
        }
      });
      
      return {
        facilityId: facility.facilityId,
        facilityName: facility.name || facility.facilityId,
        clientName: client ? `${client.surname || ''} ${client.mainName || ''}`.trim() : 'No Client',
        clientAddress: client ? `${client.prefectureCity || ''} ${client.addressDetail || ''}`.trim() : 'No Address',
        hasClient: !!client
      };
    }));

    res.json({
      success: true,
      facilities: facilitiesWithClients
    });

  } catch (error) {
    console.error('Get facilities error:', error);
    res.status(500).json({ error: '施設情報の取得に失敗しました' });
  }
});

module.exports = router;
