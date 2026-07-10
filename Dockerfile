# Multi-stage production image for NAFGEM HR (API + static UI)
FROM node:20-alpine AS frontend
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.ts tsconfig*.json tailwind.config.ts postcss.config.js components.json ./
COPY public ./public
COPY src ./src
ARG VITE_API_URL=
ARG VITE_AUTH_DISABLED=false
ARG VITE_MAIN_SITE_URL=https://nafgemtanzania.or.tz
ARG VITE_HR_PORTAL_URL=https://hr.nafgemtanzania.or.tz
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_AUTH_DISABLED=$VITE_AUTH_DISABLED
ENV VITE_MAIN_SITE_URL=$VITE_MAIN_SITE_URL
ENV VITE_HR_PORTAL_URL=$VITE_HR_PORTAL_URL
RUN npm run build

FROM node:20-alpine AS server
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev
COPY server ./
COPY --from=frontend /app/dist /app/dist

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000
CMD ["node", "index.js"]
