# MLabs WordPress Tracking Script

Um sistema completo de tracking para sites WordPress que captura, armazena e transmite parâmetros de campanha de marketing através de cookies, botões e formulários.

## 📋 Visão Geral

Este script JavaScript (Vanilla) implementa um sistema de tracking completo que:

- ✅ Captura parâmetros de campanha via URL
- ✅ Armazena dados em cookies persistentes  
- ✅ Envia parâmetros em cliques de botões
- ✅ Integra com formulários de cadastro
- ✅ Suporta API MLabs com validação completa
- ✅ Inclui integração com reCAPTCHA v3

## 🚀 Instalação Rápida

### WordPress

1. **Copie o arquivo `mlabs-tracking.js` para seu tema:**
   ```
   wp-content/themes/seu-tema/js/mlabs-tracking.js
   ```

2. **Adicione ao seu `functions.php`:**
   ```php
   function enqueue_mlabs_tracking() {
       wp_enqueue_script('mlabs-tracking', get_template_directory_uri() . '/js/mlabs-tracking.js', array(), '1.0', true);
   }
   add_action('wp_enqueue_scripts', 'enqueue_mlabs_tracking');
   ```

3. **Ou adicione diretamente no `header.php`:**
   ```html
   <script src="<?php echo get_template_directory_uri(); ?>/js/mlabs-tracking.js"></script>
   ```

### Uso Geral

```html
<script src="mlabs-tracking.js"></script>
<script>
// O script inicia automaticamente, mas você pode usar:
mlabsTracker.debug(); // Para ver parâmetros capturados
</script>
```

## 📊 Parâmetros Rastreados

| Parâmetro | Descrição | Exemplo |
|-----------|-----------|---------|
| `origin_page` | Path da página atual | `/`, `/blog/artigo` |
| `utm_source` | Fonte da campanha | `google`, `facebook` |
| `utm_medium` | Meio da campanha | `cpc`, `email`, `social` |
| `utm_campaign` | Nome da campanha | `promocao-verao` |
| `gclid` | ID do Google Ads | `Cj0KCQjw267G...` |
| `coupon` | Código do cupom | `BLOGMLABS` |
| `_ga` | Parâmetro Google Analytics | `GA1.1.43158875...` |
| `_gl` | Parâmetro GTM | `1*12zbmgi*_gcl_aw...` |

## 🔗 URLs de Exemplo

### URL Básica com UTM:
```
https://seusite.com/?utm_source=google&utm_medium=cpc&utm_campaign=institucional&gclid=Cj0KCQjw267GBhCSARIsAOjVJ4FYsqQY
```

### URL Completa com Cupom:
```
https://seusite.com/blog/artigo?utm_source=google&utm_medium=cpc&utm_campaign=blog&coupon=DESCONTO10&gclid=abc123
```

## 🎯 Configuração de Botões

### Automática (Recomendada)
O script detecta automaticamente botões com:
- URLs contendo `accounts.mlabs.io`
- Classes CSS: `teste-gratis`, `cadastro`
- Texto: "Teste Grátis", "Cadastro"

### Manual
```html
<!-- Adicione data-mlabs-track para tracking manual -->
<a href="https://accounts.mlabs.io/start" data-mlabs-track>
    Teste Grátis 🎁
</a>

<button data-mlabs-track onclick="redirecionar()">
    Cadastre-se
</button>
```

## 📝 Configuração de Formulários

### Automática
O script detecta formulários com:
- Atributo `data-mlabs-form`
- Classe `mlabs-signup-form`
- Campo de email presente
- Action contendo "accounts"

### Manual
```html
<form data-mlabs-form>
    <input type="text" name="name" required placeholder="Nome completo">
    <input type="email" name="email" required placeholder="email@exemplo.com">
    <input type="password" name="password" required placeholder="Senha123@">
    <button type="submit">Cadastrar</button>
</form>
```

### Campos Aceitos
| Campo | Nome HTML | Obrigatório | Validação |
|-------|-----------|-------------|-----------|
| Nome | `name`, `firstName` + `lastName` | ✅ | Min. 2 caracteres |
| Email | `email` | ✅ | Formato válido |
| Senha | `password` | ✅ | [Regras específicas](#validação-de-senha) |
| Telefone | `phone` | ❌ | - |
| Termos | `terms` | ✅ | Checkbox marcado |

## 🔒 Validação de Senha

A senha deve conter **todos** os requisitos:
- ✅ Mínimo 6 caracteres
- ✅ 1 letra maiúscula (A-Z)
- ✅ 1 letra minúscula (a-z)  
- ✅ 1 número (0-9)
- ✅ 1 caractere especial (!@#$%^&*(),.?":{}|<>)

**Exemplos válidos:** `MinhaSenh@1`, `Teste123!`, `Senha#456`

## 🌐 Integração com API

### Endpoints
- **Produção:** `https://core-api.mlabs.io/v1/accounts`
- **Homologação:** `https://homolog-core-api.mlabs.com.br/v1/accounts/`

### Payload Enviado
```json
{
  "name": "João Silva",
  "email": "joao@exemplo.com", 
  "password": "MinhaSenh@123",
  "language": "pt-BR",
  "user_agent": "Mozilla/5.0...",
  "captcha": "token_recaptcha_v3",
  "gclid": "Cj0KCQjw267G...",
  "utm_source": "google",
  "utm_medium": "cpc", 
  "utm_campaign": "institucional",
  "origin_page": "/blog/artigo",
  "origin_click": "form_site"
}
```

### Resposta da API
```json
{
  "success": true,
  "redirect_url": "https://app.mlabs.io/dashboard",
  "user_id": 12345
}
```

## 🍪 Gerenciamento de Cookies

### Configuração Padrão
- **Prefixo:** `mlabs_`
- **Expiração:** 30 dias
- **Path:** `/`
- **SameSite:** `Lax`

### Cookies Criados
```
mlabs_utm_source=google
mlabs_utm_medium=cpc
mlabs_utm_campaign=institucional
mlabs_gclid=Cj0KCQjw267G...
mlabs_origin_page=/blog/artigo
```

### Manipulação Manual
```javascript
// Definir cookie
mlabsTracker.setCookie('custom_param', 'valor');

// Ler cookie  
const valor = mlabsTracker.getCookie('custom_param');

// Ver todos os parâmetros
console.log(mlabsTracker.debug());
```

## 🛠️ API do Script

### Métodos Principais

```javascript
// Inicializar (executado automaticamente)
mlabsTracker.init();

// Debug - ver parâmetros capturados
mlabsTracker.debug();

// Obter todos os parâmetros de tracking
mlabsTracker.getAllTrackingParams();

// Manipular cookies
mlabsTracker.setCookie('nome', 'valor', 30); // 30 dias
mlabsTracker.getCookie('nome');

// Validações
mlabsTracker.isValidEmail('teste@exemplo.com');
mlabsTracker.isValidPassword('MinhaSenh@123');
```

### Eventos Personalizados

```javascript
// Escutar eventos de tracking
document.addEventListener('mlabs:paramsCaptured', function(e) {
    console.log('Parâmetros capturados:', e.detail);
});

document.addEventListener('mlabs:buttonClick', function(e) {
    console.log('Botão clicado:', e.detail);
});

document.addEventListener('mlabs:formSubmit', function(e) {
    console.log('Formulário enviado:', e.detail);
});
```

## 🧪 Páginas de Teste

O projeto inclui páginas HTML para testar toda a funcionalidade:

### `test-page-1.html` - Página Principal
- ✅ Captura de parâmetros URL
- ✅ Exibição de tracking em tempo real
- ✅ Botões de teste para redirecionamento
- ✅ Formulário básico de cadastro
- ✅ Ferramentas de debug

### `test-page-2.html` - Formulário Completo  
- ✅ Formulário avançado com validação
- ✅ Preview do payload da API
- ✅ Teste de conexão com API
- ✅ Validação de senha em tempo real
- ✅ Simulação de reCAPTCHA

### Como Testar

1. **Abra `test-page-1.html` no navegador**
2. **Adicione parâmetros na URL:**
   ```
   test-page-1.html?utm_source=teste&utm_medium=cpc&gclid=abc123
   ```
3. **Verifique se os parâmetros foram capturados**
4. **Teste os botões de redirecionamento**
5. **Navegue para a página 2 e teste o formulário**

## ⚙️ Configuração Avançada

### Personalizar Endpoints
```javascript
// Alterar endpoint da API
mlabsTracker.config.apiEndpoints.production = 'https://sua-api.com/accounts';

// Alterar chave do reCAPTCHA
mlabsTracker.config.recaptchaSiteKey = 'sua-chave-aqui';
```

### Personalizar Cookies
```javascript
// Alterar configurações de cookie
mlabsTracker.config.cookiePrefix = 'minha_empresa_';
mlabsTracker.config.cookieExpireDays = 60;
```

### Adicionar Parâmetros Customizados
```javascript
// Adicionar novos parâmetros para rastreamento
mlabsTracker.config.trackingParams.push('custom_param');
```

## 🔍 Troubleshooting

### Parâmetros não são capturados
1. Verifique se a URL contém os parâmetros
2. Abra o console e execute `mlabsTracker.debug()`
3. Verifique se há erros JavaScript no console

### Botões não redirecionam com parâmetros
1. Verifique se o botão tem `data-mlabs-track` ou é detectado automaticamente
2. Confirme se o href está correto
3. Verifique o console para logs de tracking

### Formulário não envia
1. Confirme se o formulário tem `data-mlabs-form`
2. Verifique se todos os campos obrigatórios estão preenchidos
3. Teste a validação de senha
4. Verifique conexão com a API

### Cookies não persistem
1. Verifique se o site está sendo acessado via HTTPS
2. Confirme se não há bloqueadores de cookie
3. Verifique se o domínio permite cookies de terceiros

## 📱 Compatibilidade

### Navegadores Suportados
- ✅ Chrome 60+
- ✅ Firefox 55+  
- ✅ Safari 12+
- ✅ Edge 79+
- ✅ Opera 47+

### Dispositivos
- ✅ Desktop
- ✅ Tablet
- ✅ Mobile

### WordPress
- ✅ WordPress 5.0+
- ✅ Temas customizados
- ✅ Plugins de cache compatíveis

## 🔐 Segurança e Privacidade

### Dados Coletados
- ✅ Apenas parâmetros de marketing públicos
- ✅ Nenhum dado pessoal sensível
- ✅ Conformidade com LGPD/GDPR

### Medidas de Segurança
- ✅ Validação de entrada rigorosa
- ✅ Sanitização de parâmetros
- ✅ Headers de segurança
- ✅ reCAPTCHA v3 obrigatório

## 📈 Monitoramento

### Google Analytics
O script é compatível com GA4 e GTM:
```javascript
// Enviar evento personalizado para GA
gtag('event', 'mlabs_tracking', {
    'custom_parameter': mlabsTracker.getCookie('utm_source')
});
```

### Console Logs
```javascript
// Habilitar logs detalhados
mlabsTracker.config.debug = true;
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📞 Suporte

- **Email:** suporte@mlabs.com.br
- **Documentação:** [docs.mlabs.com.br](https://docs.mlabs.com.br)
- **Issues:** Use o sistema de issues do GitHub

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para detalhes.

---

**Desenvolvido com ❤️ pela equipe MLabs**