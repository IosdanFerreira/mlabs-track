<?php
/**
 * MLabs Tracking WordPress Integration Example
 * 
 * Add this code to your theme's functions.php file or create a custom plugin
 */

// Enqueue the MLabs tracking script
function mlabs_enqueue_tracking_script() {
    // Enqueue the tracking script
    wp_enqueue_script(
        'mlabs-tracking',
        get_template_directory_uri() . '/js/mlabs-tracking.js',
        array(),
        '1.0.0',
        true
    );
    
    // Add custom configuration if needed
    $config = array(
        'api_endpoint' => 'https://core-api.mlabs.io/v1/accounts',
        'recaptcha_key' => '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI', // Replace with your key
        'debug_mode' => (WP_DEBUG === true)
    );
    
    wp_localize_script('mlabs-tracking', 'mlabsConfig', $config);
}
add_action('wp_enqueue_scripts', 'mlabs_enqueue_tracking_script');

// Add reCAPTCHA script to head
function mlabs_add_recaptcha() {
    $recaptcha_key = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'; // Replace with your key
    echo '<script src="https://www.google.com/recaptcha/api.js?render=' . $recaptcha_key . '"></script>';
}
add_action('wp_head', 'mlabs_add_recaptcha');

// Shortcode for MLabs signup form
function mlabs_signup_form_shortcode($atts) {
    $atts = shortcode_atts(array(
        'title' => 'Cadastre-se Grátis',
        'button_text' => 'Criar Conta',
        'show_phone' => 'false',
        'redirect_url' => '',
        'coupon' => ''
    ), $atts);
    
    ob_start();
    ?>
    <div class="mlabs-signup-widget">
        <h3><?php echo esc_html($atts['title']); ?></h3>
        <form data-mlabs-form class="mlabs-signup-form" <?php if($atts['redirect_url']) echo 'data-redirect="' . esc_url($atts['redirect_url']) . '"'; ?>>
            <div class="form-group">
                <input type="text" name="name" required placeholder="Nome completo" />
            </div>
            <div class="form-group">
                <input type="email" name="email" required placeholder="E-mail" />
            </div>
            <div class="form-group">
                <input type="password" name="password" required placeholder="Senha (min. 6 caracteres)" />
            </div>
            <?php if ($atts['show_phone'] === 'true'): ?>
            <div class="form-group">
                <input type="tel" name="phone" placeholder="Telefone (opcional)" />
            </div>
            <?php endif; ?>
            <?php if ($atts['coupon']): ?>
            <input type="hidden" name="coupon" value="<?php echo esc_attr($atts['coupon']); ?>" />
            <?php endif; ?>
            <div class="form-group">
                <label>
                    <input type="checkbox" name="terms" required />
                    Aceito os <a href="/termos" target="_blank">Termos de Uso</a>
                </label>
            </div>
            <button type="submit" class="btn btn-primary">
                <?php echo esc_html($atts['button_text']); ?>
            </button>
        </form>
    </div>
    
    <style>
    .mlabs-signup-widget {
        max-width: 400px;
        margin: 20px 0;
        padding: 20px;
        border: 1px solid #ddd;
        border-radius: 8px;
        background: #f9f9f9;
    }
    .mlabs-signup-widget h3 {
        margin-bottom: 20px;
        color: #333;
    }
    .mlabs-signup-form .form-group {
        margin-bottom: 15px;
    }
    .mlabs-signup-form input[type="text"],
    .mlabs-signup-form input[type="email"],
    .mlabs-signup-form input[type="password"],
    .mlabs-signup-form input[type="tel"] {
        width: 100%;
        padding: 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 16px;
    }
    .mlabs-signup-form button {
        width: 100%;
        padding: 14px;
        background: linear-gradient(45deg, #667eea, #764ba2);
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s;
    }
    .mlabs-signup-form button:hover {
        transform: translateY(-1px);
    }
    .mlabs-signup-form label {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        font-size: 14px;
        line-height: 1.4;
    }
    .mlabs-signup-form input[type="checkbox"] {
        margin-top: 2px;
    }
    </style>
    <?php
    return ob_get_clean();
}
add_shortcode('mlabs_signup', 'mlabs_signup_form_shortcode');

// Add tracking buttons automatically to specific content
function mlabs_add_tracking_buttons($content) {
    // Only add on specific pages or post types
    if (is_single() || is_page()) {
        $buttons = '
        <div class="mlabs-cta-buttons" style="margin: 30px 0; text-align: center;">
            <a href="https://accounts.mlabs.io/start" data-mlabs-track class="btn-teste-gratis" style="display: inline-block; padding: 15px 30px; background: linear-gradient(45deg, #667eea, #764ba2); color: white; text-decoration: none; border-radius: 6px; margin: 0 10px; font-weight: 600;">
                🎁 Teste Grátis 30 Dias
            </a>
            <a href="https://accounts.mlabs.io/register" data-mlabs-track class="btn-cadastro" style="display: inline-block; padding: 15px 30px; background: linear-gradient(45deg, #56ab2f, #a8e6cf); color: white; text-decoration: none; border-radius: 6px; margin: 0 10px; font-weight: 600;">
                📝 Criar Conta
            </a>
        </div>';
        
        // Add buttons after first paragraph
        $content = preg_replace('/(<p>.*?<\/p>)/', '$1' . $buttons, $content, 1);
    }
    
    return $content;
}
// Uncomment the line below to automatically add CTA buttons to posts
// add_filter('the_content', 'mlabs_add_tracking_buttons');

// Admin menu for tracking settings
function mlabs_tracking_admin_menu() {
    add_options_page(
        'MLabs Tracking',
        'MLabs Tracking',
        'manage_options',
        'mlabs-tracking',
        'mlabs_tracking_admin_page'
    );
}
add_action('admin_menu', 'mlabs_tracking_admin_menu');

// Admin page for tracking settings
function mlabs_tracking_admin_page() {
    if (isset($_POST['submit'])) {
        update_option('mlabs_recaptcha_key', sanitize_text_field($_POST['recaptcha_key']));
        update_option('mlabs_api_endpoint', sanitize_url($_POST['api_endpoint']));
        update_option('mlabs_auto_buttons', isset($_POST['auto_buttons']));
        echo '<div class="notice notice-success"><p>Configurações salvas!</p></div>';
    }
    
    $recaptcha_key = get_option('mlabs_recaptcha_key', '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI');
    $api_endpoint = get_option('mlabs_api_endpoint', 'https://core-api.mlabs.io/v1/accounts');
    $auto_buttons = get_option('mlabs_auto_buttons', false);
    ?>
    <div class="wrap">
        <h1>MLabs Tracking Settings</h1>
        <form method="post">
            <table class="form-table">
                <tr>
                    <th>reCAPTCHA Site Key</th>
                    <td>
                        <input type="text" name="recaptcha_key" value="<?php echo esc_attr($recaptcha_key); ?>" class="regular-text" />
                        <p class="description">Chave do site do reCAPTCHA v3</p>
                    </td>
                </tr>
                <tr>
                    <th>API Endpoint</th>
                    <td>
                        <input type="url" name="api_endpoint" value="<?php echo esc_url($api_endpoint); ?>" class="regular-text" />
                        <p class="description">URL da API MLabs para envio dos formulários</p>
                    </td>
                </tr>
                <tr>
                    <th>Botões Automáticos</th>
                    <td>
                        <label>
                            <input type="checkbox" name="auto_buttons" <?php checked($auto_buttons); ?> />
                            Adicionar botões CTA automaticamente aos posts
                        </label>
                    </td>
                </tr>
            </table>
            <?php submit_button(); ?>
        </form>
        
        <h2>Como Usar</h2>
        <h3>Shortcode do Formulário</h3>
        <p>Use o shortcode <code>[mlabs_signup]</code> para adicionar um formulário de cadastro em qualquer lugar:</p>
        <pre>[mlabs_signup title="Teste Grátis por 30 Dias" button_text="Começar Agora" coupon="BLOG30"]</pre>
        
        <h3>Botões de Tracking</h3>
        <p>Adicione <code>data-mlabs-track</code> em qualquer link para atividade tracking:</p>
        <pre>&lt;a href="https://accounts.mlabs.io/start" data-mlabs-track&gt;Teste Grátis&lt;/a&gt;</pre>
        
        <h3>Formulários Personalizados</h3>
        <p>Adicione <code>data-mlabs-form</code> em qualquer formulário para ativar tracking:</p>
        <pre>&lt;form data-mlabs-form&gt;...&lt;/form&gt;</pre>
    </div>
    <?php
}

// AJAX handler for form debugging (admin only)
function mlabs_debug_tracking() {
    if (!current_user_can('manage_options')) {
        wp_die('Unauthorized');
    }
    
    $cookies = $_COOKIE;
    $mlabs_cookies = array();
    
    foreach ($cookies as $name => $value) {
        if (strpos($name, 'mlabs_') === 0) {
            $mlabs_cookies[$name] = $value;
        }
    }
    
    wp_send_json_success(array(
        'cookies' => $mlabs_cookies,
        'url' => $_SERVER['REQUEST_URI'],
        'user_agent' => $_SERVER['HTTP_USER_AGENT'],
        'timestamp' => current_time('mysql')
    ));
}
add_action('wp_ajax_mlabs_debug', 'mlabs_debug_tracking');

// Add debug info to admin bar (for admins only)
function mlabs_admin_bar_debug($wp_admin_bar) {
    if (!current_user_can('manage_options')) {
        return;
    }
    
    $wp_admin_bar->add_node(array(
        'id' => 'mlabs-debug',
        'title' => 'MLabs Debug',
        'href' => '#',
        'meta' => array(
            'class' => 'mlabs-debug-button',
            'onclick' => 'if(window.mlabsTracker) { console.log("MLabs Debug:", window.mlabsTracker.debug()); alert("Check console for debug info"); } else { alert("MLabs Tracker not loaded"); }'
        )
    ));
}
add_action('admin_bar_menu', 'mlabs_admin_bar_debug', 100);
?>