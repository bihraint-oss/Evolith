# Evolith 协作者指南

> 这是给你的 Claude Code 协作规则。请按以下步骤设置，你的 Claude 就能和队友的 Claude 自动同步项目进度。

---

## 1. 一次性设置（约5分钟）

### 1.1 安装工具

```bash
# 安装 Bun（如果还没有）
curl -fsSL https://bun.sh/install | bash

# 安装 Claude Code CLI
# 参考：https://docs.anthropic.com/en/docs/claude-code
```

### 1.2 Clone 项目

```bash
git clone https://github.com/bihraint-oss/space.git evolith
cd evolith
```

### 1.3 配置 Claude Code 权限

在项目根目录创建 `.claude/settings.json`（已存在则确认内容如下）：

```json
{
  "permissions": {
    "defaultMode": "bypassPermissions"
  }
}
```

这会避免每次编辑都弹权限确认。

### 1.4 验证记忆系统

```bash
# 确认这些文件存在
ls .claude/CLAUDE.md
ls .claude/memory/
```

如果你用 Claude Code 打开这个项目，Claude 会自动读取 `.claude/CLAUDE.md`，里面包含所有规则。

---

## 2. 每次对话的流程

### 开始工作前

1. **打开项目目录**：`cd /path/to/evolith`
2. **启动 Claude Code**：`claude`
3. Claude 会自动：
   - 读取 `.claude/CLAUDE.md`（项目规则）
   - 读取 `.claude/memory/INDEX.md`（当前状态）
4. **你手动确认 Claude 先 pull**：告诉 Claude "先 git pull 拉最新状态"

### 工作中

- 正常和 Claude 对话，让它写代码
- Claude 会自动更新记忆文件（进度、决策、问题等）
- Claude 会在完成每个子任务后自动 commit

### 结束工作时

告诉 Claude："结束对话，同步记忆"。Claude 会：
1. 更新所有相关记忆文件
2. 用 `memory: ...` 格式 commit
3. Push 到 GitHub

---

## 3. 记忆系统说明

### 文件结构

```
.claude/memory/
├── INDEX.md        # 总览：先读这个，了解当前状态
├── PROGRESS.md     # 进度追踪：每个阶段的每个子任务状态
├── DECISIONS.md    # 技术决策：做了什么选择，为什么
├── ISSUES.md       # 问题记录：遇到的bug和解决方案
├── DETAILS.md      # 实现细节：模式、约定、gotchas
├── TODOS.md        # 待办事项：下一步要做什么
└── API-LOG.md      # API变更：端点的增删改记录
```

### Commit 规则

| 类型 | 前缀 | 示例 |
|---|---|---|
| 记忆更新 | `memory:` | `memory: update progress — Phase 1 done` |
| 新功能 | `feat:` | `feat: add JWT auth routes` |
| Bug修复 | `fix:` | `fix: scoring algorithm off-by-one` |
| 重构 | `refactor:` | `refactor: extract auth middleware` |

**记忆和代码分开提交，不要混在一起。**

---

## 4. 协作同步规则

### 你和队友的工作同步

```
你结束工作 → commit + push → 队友 pull → 队友的 Claude 读到你的记忆 → 继续工作
```

### 冲突处理

- **记忆文件冲突**：PROGRESS/ISSUES/TODOS 以远程版本为准（队友可能更新了）
- **DECISIONS/DETAILS/API-LOG**：合并（这些是追加式的，不删除条目）
- **代码冲突**：正常 git 冲突解决流程

### 不要做的事

- 不要手动编辑 `.claude/memory/` 文件（让 Claude 来做）
- 不要 `git push --force`
- 不要 `git clean -fd`（会删除未追踪文件）
- 不要把 `.env` 提交到 git

---

## 5. 注意事项

- 这套规则是**当前版本**，可能会更新。以 `.claude/CLAUDE.md` 中的规则为准
- 如果 Claude 没有自动更新记忆，提醒它："更新记忆文件并 push"
- 记忆文件用英文写（Claude 之间的同步语言），代码注释按项目约定
- 有问题就在 GitHub issue 里讨论，或直接问你的 Claude
