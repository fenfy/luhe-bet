# luhe-bet 路合投注录入统计

Vue 3 + JavaScript + Vite + Element Plus。录入员登录后录入投注，下方实时显示所选期的生肖、号码、色波投注统计。

## 依赖的后端

luhe-admin（:8060），需要先应用 `D:\workspace\luhe\luhe-bet-api.patch`：

- `POST /login` 支持 `rememberMe`（7 天滑动续期）
- `GET /lottery/bet/stats`、`POST /lottery/bet/batch`、`DELETE /lottery/bet/undo/{ids}`
- `sql/update_20261014_bet_entry_role.sql` 新建「录入员」角色，给录入账号分配该角色

## 开发

```bash
yarn
yarn dev        # http://localhost:81 ，/dev-api 代理到 localhost:8060
yarn test       # 纯函数单元测试（node --test）
yarn build      # 输出 dist/
```

## 环境变量

默认值写在 `src/config.js`：标题「路合录入统计」，接口前缀开发 `/dev-api`、生产 `/prod-api`。需要修改时在项目根目录新建 `.env.development` / `.env.production`，覆盖 `VITE_APP_TITLE`、`VITE_APP_BASE_API`。

## 部署

`dist/` 为静态文件；使用 hash 路由，nginx 只需把 `/prod-api/` 反向代理到 luhe-admin（去掉前缀），与 luhe-ui 相同。

## 说明

- 登录沿用后台的 tianai 滑块验证码（开关跟随后端 `captcha.enabled`）。
- 勾选「自动登录」：令牌存 localStorage，有效期 7 天，每天首次访问自动续期；不勾选：存 sessionStorage，30 分钟。
- 统计口径：生肖、色波按投注项汇总笔数与金额；号码把所有投注（直接押号、生肖、色波）按每号金额摊到覆盖的号码上。
- 录错时可撤销最近一次提交（只能撤销自己录入、未开奖的投注）；其他修改到 luhe-ui 后台处理。
