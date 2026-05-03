FROM nginx:1.27-alpine

COPY infrastructure/nginx/ginx.conf /etc/nginx/conf.d/default.conf
