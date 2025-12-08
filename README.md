# Cãolorias

App de gestão de calorias para cães - Desenvolvido com React, Vite, TypeScript e Capacitor.

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Rodando como app mobile com Capacitor

Este projeto usa Vite; o build web é gerado na pasta `dist` (script `npm run build` ou `npm run build:web`). Essa pasta é usada pelo `webDir` do `capacitor.config.ts`.

### Rodar o Cãolorias como app Android (via Capacitor)

1. Instalar dependências:
   ```bash
   npm install
   ```

2. Gerar o build web:
   ```bash
   npm run build:web
   ```
   Isso gera o build de produção em `dist`, que será usado pelo Capacitor.

3. Sincronizar o Capacitor:
   ```bash
   npm run cap:sync
   ```

4. (Somente da primeira vez) adicionar o projeto Android:
   ```bash
   npm run cap:add:android
   ```

5. Abrir o projeto Android no Android Studio:
   ```bash
   npm run cap:open:android
   ```

6. No Android Studio, selecione um emulador ou dispositivo e clique em "Run" para testar. Para publicar, use "Generate Signed Bundle / APK" para criar o `.aab`.

Para iOS, o fluxo é semelhante usando `npm run cap:add:ios` e `npm run cap:open:ios`.

## Publicando no GitHub

Este projeto já está configurado como um repositório Git. Para publicá-lo no GitHub:

1. **Criar um novo repositório no GitHub:**
   - Acesse [github.com](https://github.com) e faça login
   - Clique em "New repository" (ou "Novo repositório")
   - Escolha um nome (ex: `caolorias`)
   - **NÃO** inicialize com README, .gitignore ou licença (já temos isso)
   - Clique em "Create repository"

2. **Conectar o repositório local ao GitHub:**
   ```bash
   # Adicione o repositório remoto (substitua SEU_USUARIO pelo seu username do GitHub)
   git remote add origin https://github.com/SEU_USUARIO/caolorias.git
   
   # Ou se preferir usar SSH:
   # git remote add origin git@github.com:SEU_USUARIO/caolorias.git
   ```

3. **Enviar o código para o GitHub:**
   ```bash
   # Renomeie a branch para 'main' se necessário
   git branch -M main
   
   # Envie o código
   git push -u origin main
   ```

4. **Próximos commits:**
   Após fazer alterações, use:
   ```bash
   git add .
   git commit -m "Descrição das alterações"
   git push
   ```

**Dica:** Se você ainda não configurou seu nome e email no Git, faça isso antes do primeiro commit:
```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu.email@example.com"
```
# calorias2
# calorias2
