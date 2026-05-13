const fs = require('fs');

try {
    let content = fs.readFileSync('c:/Users/0/Desktop/project2/index.html', 'utf8');
    
    // Replace the definition of heartIcon string
    content = content.replace(
        /const heartIcon = isFavorite \? [^;]+;/g,
        "const heartIcon = isFavorite ? '<i class=\"fas fa-heart\" style=\"color:#f43f5e;\"></i>' : '<i class=\"far fa-heart\"></i>';"
    );
    
    // Replace text assignments for favorites logic
    // Look for the "Remove from favorites" block where textContent is set
    content = content.replace(
        /userFavorites\.delete\(professionalId\);\s*heartIcon\.textContent = [^;]+;/g,
        "userFavorites.delete(professionalId);\n                    heartIcon.innerHTML = '<i class=\"far fa-heart\"></i>';"
    );
    
    // Look for the "Add to favorites" block where textContent is set
    content = content.replace(
        /userFavorites\.add\(professionalId\);\s*heartIcon\.textContent = [^;]+;/g,
        "userFavorites.add(professionalId);\n                    heartIcon.innerHTML = '<i class=\"fas fa-heart\" style=\"color:#f43f5e;\"></i>';"
    );
    
    // There is one more place! innerHTML must be used instead of textContent since we are injecting HTML tags.
    // The previous implementation used text nodes, but the span itself is what we target.
    // Since we originally set <span ...>  </span> the inner HTML is indeed what gets replaced.
    
    fs.writeFileSync('c:/Users/0/Desktop/project2/index.html', content, 'utf8');
    console.log("Successfully replaced emoji logic with FontAwesome HTML!");
} catch(e) {
    console.log(e);
}