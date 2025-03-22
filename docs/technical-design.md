# 记账Web应用技术方案设计文档

## 1. 系统架构设计

### 1.1 整体架构

- **应用类型**：Client-Side Rendered PWA
- **架构模式**：单页面应用（SPA）+ 本地存储
- **技术栈**：
  - 前端框架：React 18 + Next.js 14
  - 状态管理：React Context API
  - 数据存储：IndexedDB（主存储）+ LocalStorage（配置存储）
  - UI 框架：Shadcn UI
  - 样式方案：Tailwind CSS
  - 图表库：Chart.js

### 1.2 核心技术选型理由

- **Next.js 14**：
  - App Router 提供更好的路由管理和页面组织
  - 内置优化和自动代码分割
  - 支持静态导出，便于部署
- **IndexedDB**：
  - 支持大容量结构化数据存储
  - 支持复杂查询和索引
  - 适合存储账目记录和票据图片
- **Shadcn UI + Tailwind CSS**：
  - 高度可定制的组件库
  - 原子化 CSS，减少打包体积
  - 响应式设计支持
- **Chart.js**：
  - 轻量级图表库
  - 丰富的图表类型
  - 良好的动画效果和交互性

## 2. 数据库设计

### 2.1 IndexedDB 数据库结构

#### 2.1.1 账目记录表（transactions）

```typescript
interface Transaction {
  id: string;            // 唯一标识符
  type: 'income' | 'expense';  // 收支类型
  amount: number;        // 金额
  categoryId: string;    // 分类ID
  date: string;         // 交易日期
  note?: string;        // 备注
  attachments?: string[]; // 票据图片（Base64）
  createdAt: string;    // 创建时间
  updatedAt: string;    // 更新时间
}
```

#### 2.1.2 分类表（categories）

```typescript
interface Category {
  id: string;           // 唯一标识符
  name: string;         // 分类名称
  type: 'income' | 'expense';  // 收支类型
  icon?: string;        // 分类图标
  isDefault: boolean;   // 是否为默认分类
  createdAt: string;    // 创建时间
  updatedAt: string;    // 更新时间
}
```

#### 2.1.3 预算表（budgets）

```typescript
interface Budget {
  id: string;           // 唯一标识符
  month: string;        // 预算月份（YYYY-MM）
  amount: number;       // 预算金额
  categoryId?: string;  // 分类ID（可选，用于分类预算）
  createdAt: string;    // 创建时间
  updatedAt: string;    // 更新时间
}
```

### 2.2 LocalStorage 存储结构

```typescript
interface AppSettings {
  theme: 'light' | 'dark';  // 主题设置
  currency: string;         // 货币单位
  language: string;         // 界面语言
  notificationEnabled: boolean;  // 通知开关
}
```

## 3. 功能模块设计

### 3.1 账目记录模块
- **核心组件**：
  - TransactionForm：记账表单组件
  - TransactionList：账目列表组件
  - TransactionDetail：账目详情组件
- **状态管理**：
  - 使用 Context API 管理账目相关状态
  - 实现乐观更新提升响应速度
- **数据同步**：
  - 自动保存到 IndexedDB
  - 支持离线操作
  - 定期数据备份提醒

### 3.2 数据统计模块
- **统计维度**：
  - 收支总览（饼图）
  - 月度趋势（折线图）
  - 分类统计（柱状图）
- **数据计算**：
  - 使用 Web Worker 处理大量数据计算
  - 实现数据缓存机制
- **图表组件**：
  - 封装 Chart.js 实现可复用图表组件
  - 支持图表交互和数据钻取

### 3.3 预算管理模块
- **预算设置**：
  - 月度总预算
  - 分类预算
  - 预算进度条
- **预警机制**：
  - 使用 Web Notification API
  - 预算使用率提醒
  - 超支预警通知

### 3.4 数据导入导出模块
- **支持格式**：
  - CSV 文件导入导出
  - JSON 数据备份还原
- **数据处理**：
  - 文件解析和格式验证
  - 数据清洗和转换
  - 批量导入优化

## 4. 性能优化方案

### 4.1 加载性能
- **代码分割**：
  - 路由级别的代码分割
  - 组件懒加载
  - 第三方库按需引入
- **资源优化**：
  - 图片懒加载和优化
  - 静态资源 CDN 加速
  - 合理的缓存策略

### 4.2 运行性能
- **渲染优化**：
  - 虚拟列表实现长列表
  - React.memo 优化组件重渲染
  - 使用 Web Worker 处理密集计算
- **存储优化**：
  - IndexedDB 索引优化
  - 定期清理过期数据
  - 大文件存储限制

## 5. 安全方案

### 5.1 数据安全
- **本地数据加密**：
  - 敏感数据 AES 加密存储
  - 使用设备指纹作为加密密钥
- **备份安全**：
  - 备份数据加密
  - 备份文件完整性校验

### 5.2 应用安全
- **输入验证**：
  - 客户端数据验证
  - XSS 防护
  - 敏感数据过滤
- **运行安全**：
  - CSP 策略配置
  - 第三方库安全审计

## 6. 部署方案

### 6.1 构建流程

```bash
# 构建步骤
1. next build        # Next.js 构建
2. next export       # 静态文件导出
3. 生成 PWA 资源     # 服务工作线程和清单文件
4. 资源优化         # 图片压缩、代码压缩
```

### 6.2 部署环境
- **推荐平台**：Vercel/Netlify
- **CDN 配置**：
  - 静态资源 CDN 分发
  - 缓存策略优化
- **监控方案**：
  - 性能监控
  - 错误追踪
  - 用户行为分析

## 7. 开发规范

### 7.1 代码规范
- **TypeScript 规范**：
  - 严格类型检查
  - 接口优先设计
- **组件规范**：
  - 功能组件化
  - Props 类型定义
  - 统一的错误处理

### 7.2 开发流程
- **版本控制**：
  - Git Flow 工作流
  - 语义化版本
- **代码审查**：
  - PR 模板
  - 代码审查清单
- **测试策略**：
  - 单元测试
  - E2E 测试
  - 性能测试

## 8. 项目里程碑

### 8.1 第一期（基础记账）
- 账目 CRUD 功能
- 基础数据存储
- 简单统计展示

### 8.2 第二期（统计分析）
- 完整统计功能
- 图表可视化
- 数据导出功能

### 8.3 第三期（预算管理）
- 预算设置功能
- 预警通知
- 离线功能支持

### 8.4 第四期（体验优化）
- UI/UX 优化
- 性能优化
- 多端适配

## 9. 风险评估与应对

### 9.1 技术风险
- **数据丢失风险**：
  - 实现自动备份机制
  - 提供数据恢复功能
- **浏览器兼容性**：
  - 降级方案
  - 兼容性检测

### 9.2 性能风险
- **数据量过大**：
  - 分页加载
  - 定期清理
  - 存储限制
- **运行卡顿**：
  - 性能监控
  - 及时优化

## 10. 技术债务管理

### 10.1 可能的技术债务
- 数据模型扩展性
- 组件复用性
- 测试覆盖率

### 10.2 解决计划
- 定期代码重构
- 持续集成优化
- 文档及时更新 