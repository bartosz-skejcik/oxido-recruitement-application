# Getting Started 🚀

Follow these instructions to get a copy of the project up and running on your local machine.

## Prerequisites 📋

- `Node.js` (v14 or later)
- `npm` (Node Package Manager)

## Installation 🔧

1. **Clone the repository**:

   ```bash
   git clone https://github.com/bartosz-skejcik/oxido-recruitement-application.git
   cd oxido
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Set up environment variables**:
   - Create a `.env` file in the root directory.
   - Add your API key for the AI service:
     ```
     OPENAI_API_KEY=your_api_key_here
     ```

## Running the Application ▶️

To start the application, run the following command:

```bash
npm run start
```

This will execute the `index.js` file, which fetches an article, interacts with the AI to suggest image placements, and generates an HTML preview.

## File Structure 📂

- `index.js`: Main application logic.
- `szablon.html`: HTML template for article previews.
- `podglad.html`: Generated HTML preview with article content.
- `.gitignore`: Specifies files and directories to be ignored by git.
- `package.json`: Contains metadata about the project and its dependencies.

## Usage 📝

1. **Fetch and Edit Article**: The application fetches an article and uses AI to suggest edits and image placements.
2. **Review Suggestions**: Review the AI's suggestions and provide feedback if necessary.
3. **Generate Preview**: Once satisfied, generate an HTML preview of the article.

