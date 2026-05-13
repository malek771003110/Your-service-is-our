import sys

file_path = "c:/Users/0/Desktop/project2/index.html"
with open(file_path, "r", encoding="utf-8") as f:
    text = f.read()

# Replace white heart emoji with empty heart font-awesome
# The emoji is: 🤍
# The red heart emoji is: ❤️

text = text.replace("'🤍'", "'<i class=\"far fa-heart\"></i>'")
text = text.replace("'❤️'", "'<i class=\"fas fa-heart\" style=\"color: #f43f5e;\"></i>'")
text = text.replace("🤍", "<i class=\"far fa-heart\"></i>")
text = text.replace("❤️", "<i class=\"fas fa-heart\" style=\"color: #f43f5e;\"></i>")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(text)

print("Icons updated via Python")