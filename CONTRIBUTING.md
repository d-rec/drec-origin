# Contribution Guidelines

These guidelines outline how to contribute effectively while maintaining a clear and organized structure, ensuring smooth collaboration and high-quality outcomes for everyone involved.

## Branching Strategy

### General Guidelines

- **Start from `develop`:** Before making any new changes, ensure you're on the `develop` branch. Pull the latest updates and create a new branch from there.
- **Base your pull requests on `develop`:** Always use the `develop` branch as the base branch for your pull requests.
- **`develop` branch:** This branch is used for ongoing development of new features and changes.
- **`staging` branch:** This branch has a public link used to preview changes internally and test them.
- **`main` branch:** This is the production branch.
- **Pull Request (PR):** Raise a new PR every time you need to move changes from `develop` to `staging` and same when you move changes from `staging` to `main`

### Branch Naming Conventions

#### **Feature Branch**

Used for specific feature work or improvements.

- **Prefix:** `ft/`
- **Example:** `ft/{FEATURE_NAME}`

#### **Hotfix Branch**

Used to quickly fix an issue on the Production branch without interrupting development work.

- **Prefix:** `ht/`
- **Example:** `ht/{BUG_NAME}`

#### **Bugfix Branch**

Used for fixing bugs that require more intensive changes.

- **Prefix:** `bg/`
- **Example:** `bg/{BUG_NAME}`

#### **Release Branch**

Used for release tasks and long-term maintenance versions. These branches are created from `develop` and merged into `main` for production.

- **Prefix:** `rl/`
- **Example:** `rl/{VERSION}`

## Commits

- **Follow Conventional Commits:** Adhere to the guidelines provided by [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) for commit messages.
  - Example:

    ```bash
    git commit -m "feat: add new feature"
    git commit -m "fix: resolve issue with..."
    ```

- **Create Logically Consistent Commits:** Try to make mid-sized commits every few minutes or hours. However, the key is to ensure that each commit represents a logically consistent contribution. If you have many changes, split them into multiple commits, ensuring each commit has an independent and clear purpose that is well described in the commit message.

- **Break Down Changes:** Make sure each change is logical and standalone. Avoid combining unrelated changes in a single commit.
  - Example of good practice:

    ```bash
    git commit -m "chore: update dependencies"
    git commit -m "docs: improve documentation"
    ```

  - Example of what to avoid:

    ```bash
    git commit -m "chore: update dependencies and fix bug"
    ```

## Pull Requests and Code Reviews

- **Push Your Changes Early:** Once you've made the first commit, go ahead and push your changes.
- **Create a Pull Request Early:** You don’t have to wait until the feature is complete to create a pull request. You can create one as soon as you've pushed your first commit.
- **PR Naming Convention:** The name of the pull request (PR) should follow the same naming convention as the commit messages. Refer to [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).
  - Example: `feat: integrate react markdown`
- **Use the PR Template:** Follow this [PR Template](.github/pull_request_template.md) when creating your PR.
- **Provide a Clear Description:** Avoid leaving the PR description empty. Ensure it includes relevant details.
- **Link Related Issues:** Make sure to link the PR to its corresponding issues.
- **Request Code Review:** Add the designated code reviewer as a reviewer to your PR to request a code review.
- **Scope of PRs:** Each PR should cover a related set of changes, focusing on a single feature, bug fix, or other specific types of changes.

## Resolving Conflicts

- Be super careful, involve the others who are working on similar stuff.
- Make sure you understand what you are accepting or refusing.
- Recent changes are not always the relevant ones, always check that you are not dismissing changes that are actually fixing another bug

## Things to avoid

- Avoid using the squash commits feature, it tends to bring conflicts especially when people are using other base branches
- Do not use git force push
- Do not merge your PRs unless your code has been reviewed by a code reviewer and the code reviewer has either approved your changes or accepted all the adjustments you have made upon their review.
- Avoid merging other dependencies PRs into the ones you are working on to avoid having duplicate changes into two PRs in case a change is needed to be used in another.
- Avoid committing the `node_modules` folder (or including it in the version history).
- Do not create “backup files.” Git already tracks changes, allowing you to revert to a previous version if needed.
- Avoid **commenting out code** without a clear and valid reason.

## Naming Convention

1. File names: **`kebab_case`**
    - All file names should be written in **`kebab_case`**
    - Use lowercase letters and separate words with a hyphen
    - Example: **`measurements-type.handle.ts`**
2. Component names: **`PascalCase`**
    - All components names should be written in **`PascalCase`**.
    - Start with an uppercase letter, and capitalize the first letter of each subsequent word.
    - Example: **`CartCard`**
3. Function names: **`camelCase`**
    - All function names should be written in **`camelCase`**.
    - Start with a lowercase letter, and capitalize the first letter of each subsequent word.
    - Example: **`calculateTotalPrice()`**
4. Class names Interface Names(Js Class Names): **`PascalCase`**
    - All class names should be written in **`PascalCase`**.
    - Start with an uppercase letter, and capitalize the first letter of each subsequent word.
    - Example: **`CustomerOrder`**
5. CSS class names: **`kebab-case`**
    - All CSS class names should be written in **`kebab-case**.`
    - Use lowercase letters and separate words with a hyphen.
    - Example: `main-layout`
6. Variables, props and parameters names: **`camelCase`**
    - All variable names should be written in **`camelCase`**.
    - Start with a lowercase letter, and capitalize the first letter of each subsequent word.
    - Example: `currentUser`
7. HTML id attribute: **`kebab-case`**
    - All HTML id attributes should be written in **kebab-case**.
    - Use lowercase letters and separate words with a hyphen.
    - Example: **customer-name-field**
8. Constants and env variables: **`UPPER_SNAKE_CASE`**
    - All constant's variable names should be written in **`UPPER_SNAKE_CASE**.`
    - Use uppercase letters and separate words with an underscore.
    - Example: **`MAX_NUM_OF_RETRIES`**
9. Enums names: **`PascalCase`**
    - All enum's names should be written in **`PascalCase`**.
    - Start with an uppercase letter, and capitalize the first letter of each subsequent word.
    - Example: **`Color`**

Makes sure your naming also satisfies the following conditions:

1. **Function names should reflect the function's role**: A function's name should accurately describe what the function does, so that other developers who read your code can understand its purpose and usage at a glance. Avoid vague or misleading names, and choose names that accurately reflect the function's role in the codebase.
2. **Avoid using ambiguous or overly general names**: Avoid using names that are too generic or abstract, such as "thing", as they don't convey enough information about what the variable or function does.
3. **Avoid using non-standard or inconsistent naming conventions**: Stick to standard naming conventions in your programming language or framework, and avoid using your own personal naming conventions or styles that deviate from common conventions.
4. **Avoid being too verbose or using excessively long names**: While it's important to use descriptive names, using overly long names can make your code harder to read and maintain. Strive for a balance between descriptive and concise names.
5. **Avoid using abbreviations or acronyms that are not widely known**: Avoid using abbreviations or acronyms that are not widely recognized or could have multiple meanings. If you must use an abbreviation, make sure it is well-known and clearly understood in the context of your code.

## Documentation

### Commenting

- Use inline comments to provide additional information or clarification for complex or tricky code segments.
- Keep comments concise and to the point. Avoid redundant or unnecessary comments.
- Avoid comments that only state what the code does. Instead, focus on why the code is written that way and the rationale behind it.
- Keep comments up-to-date as code evolves. Outdated comments can be misleading and cause confusion.

### Readme

- Update the README file whenever there is a change to the project's configuration or installation instructions.
- Update the README file whenever there is a change to the project's structure, organization or architecture. This includes changes to file directories, infrastructure changes, major libraries,…
