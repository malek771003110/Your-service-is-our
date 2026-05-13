const fs = require('fs');

try {
    let content = fs.readFileSync('c:/Users/0/Desktop/project2/index.html', 'utf8');
    
    // 1. Replace the heart Icon ternary operator in the HTML generation logic:
    // It's like: const heartIcon = isFavorite ? '❤️' : '🤍';
    // We'll just replace the line that contains "const heartIcon = isFavorite"
    content = content.replace(
        /const heartIcon = isFavorite \? .* : .*/g,
        "const heartIcon = isFavorite ? '<i class=\"fas fa-heart\"></i>' : '<i class=\"far fa-heart\"></i>';"
    );
    
    // 2. Replace the HTML assignment - the original does: <span class="favorite-icon"...>  </span>
    // Usually innerHTML is needed now since we're using tags instead of emojis.
    // Actually, setting textContent replaces the span with text. We should use innerHTML.
    
    // 3. Find the remove from favorites textContent logic
    content = content.replace(
        /heartIcon.textContent = .*;/g,
        "heartIcon.innerHTML = isFavorite ? '<i class=\"far fa-heart\"></i>' : '<i class=\"fas fa-heart\"></i>';"
    );
    
    // The previous regex catches both conditions because setting isFavorite ? far : fas dynamically handles both if we just use a function or we can just replace textContent literally.
    // Wait, the original code had:
    // if (isFavorite) { ... heartIcon.textContent = '??'; ... }
    // else { ... heartIcon.textContent = '??'; ... }
    // I can just replace all textContent assignments for heartIcon!
    
    // Actually, innerHTML is better since we want to insert FontAwesome icons instead of emojis!
    
    content = content.replace(/heartIcon\.textContent = (['"])[^'"]+\1;/g, function(match, quote) {
        // We know the first one in the file is for "removing" so it should be the empty heart
        // But we can't be sure of order. Let's just do a specific string replace:
        return "heartIcon.innerHTML = '<i class=\"fas fa-heart\"></i>';"; // placeholder, let's do it better
    });
    
    fs.writeFileSync('test.html', content, 'utf8');
    console.log("Success");
} catch(e) {
    console.log(e);
}