FROM node:24-alpine

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN NODE_OPTIONS=--max-old-space-size=4096 pnpm build

EXPOSE 3000

CMD ["sh", "-c", "pnpm db:migrate && pnpm db:seed:target-action-types && node .output/server/index.mjs"]
