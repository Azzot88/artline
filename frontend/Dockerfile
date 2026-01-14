# Stage 1: Base (Install dependencies)
FROM node:18-alpine as base
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .

# Stage 2: Development
FROM base as dev
CMD ["npm", "run", "dev", "--", "--host", "--port", "5173"]

# Stage 3: Build the React Application
FROM base as build

WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
# We use --legacy-peer-deps to be safe with older/conflicting dependencies often found in templates
RUN npm install --legacy-peer-deps

# Copy the rest of the application code
COPY . .

# Build the application
# Assumes the build script output is 'dist' (Vite default). 
# If using CRA, change this to: COPY --from=build /app/build /usr/share/nginx/html
RUN npm run build

# Stage 2: Serve the React Application with Nginx
FROM nginx:stable-alpine

# Copy the build output from the previous stage
# Note: Adjust 'dist' to 'build' if using Create React App
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
