#!/bin/bash

# Build the application
echo "Building PostureGuard application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "Build successful! Deploying to GitHub Pages..."
    
    # Add dist folder to git
    git add dist/
    git commit -m "Deploy PostureGuard to GitHub Pages"
    
    # Push to GitHub
    git push origin main
    
    echo "Deployment complete! The application will be available at:"
    echo "https://drakewu.github.io/Break_reminder/"
else
    echo "Build failed! Please check the errors above."
    exit 1
fi
