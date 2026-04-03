---
description: Como fazer deploy do SaaS APR NR-12 na Vercel
---

# Deploy para Vercel

## Pré-requisitos
- Estar logado na Vercel (`vercel login` já foi feito)
- As variáveis de ambiente já estão configuradas no projeto Vercel

## URL de Produção
O link fixo e permanente do app é: **https://apr-nr12-novo.vercel.app**

## Passos para deploy

// turbo-all

1. Certifique-se de que o código compila sem erros:
```
cmd.exe /c "rd /s /q .next 2>nul & npx next build"
```

2. Se o build passou, faça o deploy para produção:
```
cmd.exe /c "vercel deploy --prod --yes"
```

O comando vai fazer upload, build e deploy automaticamente.

## Notas
- O deploy demora cerca de 1 minuto
- Variáveis de ambiente já estão no Vercel (NEXT_PUBLIC_SUPABASE_URL, etc.)
- Após deploy, acesse: https://apr-nr12-novo.vercel.app
- Para instalar como app no celular: acesse o link > menu do navegador > "Adicionar à tela inicial"
