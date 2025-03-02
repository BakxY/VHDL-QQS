# Contributing to VHDL-QQS

Thank you for your interest in contributing to VHDL-QQS! We appreciate your time and effort in making this project better. Whether you're fixing bugs, adding new features, or improving the documentation, your contributions are welcome.

## How to Contribute

Here's a guide to help you get started with contributing:

1. **Fork the Repository:** Start by forking the VHDL-QQS repository on GitHub. This creates a copy of the project under your GitHub account.

2. **Clone Your Fork:** Clone your forked repository to your local machine:

    ```bash
    git clone https://github.com/your-username/VHDL-QQS.git # Replace with your GitHub username
    ```

3. **Create a Branch:** Create a new branch for your contribution. Use a descriptive name that reflects the purpose of your changes (e.g., `feature/new-feature`, `bugfix/fix-issue-123`, `docs/improve-readme`).  Using prefixes like `feature/`, `bugfix/`, or `docs/` helps organize pull requests.

    ```bash
    git checkout -b feature/new-feature # Replace with your branch name
    ```

4. **Make Your Changes:** Make the necessary changes to the code, documentation, or any other files. Follow the project's coding style and guidelines (see below).

5. **Commit Your Changes:** Commit your changes with a clear and concise message that describes what you've done. Use the present tense (e.g., "Add new feature," "Fix bug," "Improve documentation").  Well-written commit messages are essential for understanding the history of the project.

    ```bash
    git add . # Add all changes (or stage specific files with `git add <file>`)
    git commit -m "Add new feature: Description of the feature" # Be more descriptive in real commits
    ```

6. **Push Your Changes:** Push your branch to your forked repository on GitHub:

    ```bash
    git push origin feature/new-feature
    ```

7. **Create a Pull Request:** Go to the original VHDL-QQS repository on GitHub. You should see a prompt to create a pull request for your branch. Click on it.

8. **Review and Merge:** The project maintainers will review your pull request. They may provide feedback or request changes. Once the review is complete and everything looks good, your changes will be merged into the main branch.

## Coding Style and Guidelines

Please follow these guidelines when contributing code:

* **Language:** The extension is written in TypeScript.
* **Style Guide:** Focus on writing clean, readable code. Avoid unnecessary abstraction or over-optimization. Use types for variables, even if TypeScript doesn't strictly require them. Don't hesitate to create new functions and files when necessary. Aim for functions with single, well-defined purposes.  Design code for reusability—if a piece of code could be reused, make it a function.
* **Documentation:** When adding a new feature, please update the [usage documentation](USAGE.md) and the [feature list in the README](README.md). Add comments to your code where needed to clarify complex logic or explain what you're doing. Comments should be concise and focus on the "why" rather than the "what."

## Reporting Bugs

If you find a bug, please open an issue on GitHub:

1. Go to the VHDL-QQS repository's [Issues tab](https://github.com/BakxY/VHDL-QQS/issues).
2. Click "New issue."
3. Provide a clear and detailed description of the bug, including steps to reproduce it.
4. Include any relevant error messages or screenshots.

## Feature Requests

If you have a feature request, please open an issue on GitHub as described in the "Reporting Bugs" section. Clearly describe the feature you'd like to see and explain why it would be beneficial.

## License

By contributing to VHDL-QQS, you agree that your contributions will be licensed under the [GPL v3](LICENSE).

Thank you again for your contributions!