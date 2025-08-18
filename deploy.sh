#!/bin/bash

# Personal Website Deployment Script
echo "🚀 Deploying Personal Website..."

# Check if there are changes to commit
if [[ -n $(git status --porcelain) ]]; then
    echo "📝 Committing changes..."
    git add .
    git commit -m "Update website content"
fi

# Push to GitHub
echo "⬆️ Pushing to GitHub..."
git push origin main

echo "✅ Deployment complete!"
echo "🌐 Your website will be available at: https://dot-agi.github.io/personal-website/"
echo ""
echo "📋 To enable GitHub Pages:"
echo "1. Go to https://github.com/dot-agi/personal-website/settings/pages"
echo "2. Select 'Deploy from a branch'"
echo "3. Choose 'main' branch"
echo "4. Select '/(root)' folder"
echo "5. Click 'Save'"
echo ""
echo "🎉 Your website will be live in a few minutes!"
