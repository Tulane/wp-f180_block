<?php
/**
 * Blocks Initializer
 *
 * Enqueue CSS/JS of all the blocks.
 *
 * @since   0.0.1
 * @package CGB
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! defined( 'INTERFOLIO_HOST' ) ) {
    define('INTERFOLIO_HOST', 'https://faculty180.interfolio.com/api.php');
}

/**
 * Enqueue Gutenberg block assets for both frontend + backend.
 *
 * Assets enqueued:
 * 1. blocks.style.build.css - Frontend + Backend.
 * 2. blocks.build.js - Backend.
 * 3. blocks.editor.build.css - Backend.
 *
 * @uses {wp-blocks} for block type registration & related functions.
 * @uses {wp-element} for WP Element abstraction — structure of blocks.
 * @uses {wp-i18n} to internationalize the block's text.
 * @uses {wp-editor} for WP editor styles.
 * @since 0.0.
 */
function wp_f180_cgb_block_assets() { // phpcs:ignore
	// Register block styles for both frontend + backend.
	wp_register_style(
		'wp_f180-cgb-style-css', // Handle.
		plugins_url( 'dist/blocks.style.build.css', dirname( __FILE__ ) ), // Block style CSS.
		array( 'wp-editor' ), // Dependency to include the CSS after it.
		null // filemtime( plugin_dir_path( __DIR__ ) . 'dist/blocks.style.build.css' ) // Version: File modification time.
	);

	// Register block editor script for backend.
	wp_register_script(
		'wp_f180-cgb-block-js', // Handle.
		plugins_url( '/dist/blocks.build.js', dirname( __FILE__ ) ), // Block.build.js: We register the block here. Built with Webpack.
		array( 'wp-blocks', 'wp-i18n', 'wp-element', 'wp-editor' ), // Dependencies, defined above.
		null, // filemtime( plugin_dir_path( __DIR__ ) . 'dist/blocks.build.js' ), // Version: filemtime — Gets file modification time.
		true // Enqueue the script in the footer.
	);

	// Register block editor styles for backend.
	wp_register_style(
		'wp_f180-cgb-block-editor-css', // Handle.
		plugins_url( 'dist/blocks.editor.build.css', dirname( __FILE__ ) ), // Block editor CSS.
		array( 'wp-edit-blocks' ), // Dependency to include the CSS after it.
		null // filemtime( plugin_dir_path( __DIR__ ) . 'dist/blocks.editor.build.css' ) // Version: File modification time.
	);

	/**
	 * Register Gutenberg block on server-side.
	 *
	 * Register the block on server-side to ensure that the block
	 * scripts and styles for both frontend and backend are
	 * enqueued when the editor loads.
	 *
	 * @link https://wordpress.org/gutenberg/handbook/blocks/writing-your-first-block-type#enqueuing-block-scripts
	 * @since 1.16.0
	 */
	register_block_type(
		'wp-f180/interfolio', array(
			// Enqueue blocks.style.build.css on both frontend & backend.
			'style'         => 'wp_f180-cgb-style-css',
			// Enqueue blocks.build.js in the editor only.
			'editor_script' => 'wp_f180-cgb-block-js',
			// Enqueue blocks.editor.build.css in the editor only.
			'editor_style'  => 'wp_f180-cgb-block-editor-css',
		)
	);
}

// Hook: Block assets.
add_action( 'init', 'wp_f180_cgb_block_assets' );

/**
 * Generate the required auth header from the passed in data
 *
 * @param $timestamp string
 * @param $request_string string
 * @return string
 */
function f180GetInterfolioAuthHeader($timestamp_string, $request_string) {
    $verb_request_string = "GET\n\n\n$timestamp_string\n$request_string";
    $encrypted_string = hash_hmac("sha1", $verb_request_string, INTERFOLIO_PRIVATE_KEY, true);
    $signed_hash = trim(base64_encode($encrypted_string));
    $authorization_header = "INTF " . INTERFOLIO_PUBLIC_KEY . ":$signed_hash";

    return $authorization_header;
}


/**
 * Custom API endpoing to get a list of users
 */
function f180GetUsersList() {
    // Get user list from Interfolio
    $request_string = "/users";
    $timestamp_string = date('Y-m-d H:i:s');
    $auth_header = f180GetInterfolioAuthHeader($timestamp_string, $request_string);
    
    # set headers
    $opts = array(
      'http'=>array(
        'method'=>"GET",
        'header'=>"TimeStamp: $timestamp_string\r\n" .
                  "Authorization: $auth_header\r\n" .
                  "INTF-DatabaseID: " . INTERFOLIO_DATABASE_ID . "\r\n"
      )
    );
    $context = stream_context_create($opts);
    $request_string .= '?data=detailed';
	$users = file_get_contents(INTERFOLIO_HOST . $request_string, false, $context);
    $users = json_decode($users);

    // Get local admin user email addresses, to compare
    $args = array (
        'role' => 'administrator',
        'order' => 'ASC',
        'orderby' => 'display_name'
    );
    $wp_user_query = new WP_User_Query($args);
    $admin_users = $wp_user_query->get_results();
    $admin_emails = array();
    foreach ($admin_users as $admin) {
        $admin_emails[] = $admin->user_email;
    }

    // Only keep the Interfolio users that are also WP users
    $admins = array();
    foreach ($users as $user) {
        if (in_array($user->email, $admin_emails)) {
            $admins[] = $user;
        }
    }

    return $admins;
}
add_action('rest_api_init', function () {
  register_rest_route( 'wp-f180/v1', '/users', array(
    'methods' => 'GET',
    'callback' => 'f180GetUsersList',
  ));
});

/**
 * Custom API endpoing to get a single user's info
 */
function f180GetUserData($data) {
    $userid = $data['userid'];

    $request_string = "/userdata";
    $timestamp_string = date('Y-m-d H:i:s');
    $auth_header = f180GetInterfolioAuthHeader($timestamp_string, $request_string);
    
    # set headers
    $opts = array(
      'http'=>array(
        'method'=>"GET",
        'header'=>"TimeStamp: $timestamp_string\r\n" .
                  "Authorization: $auth_header\r\n" .
                  "INTF-DatabaseID: " . INTERFOLIO_DATABASE_ID . "\r\n"
      )
    );
    $context = stream_context_create($opts);
    $request_string .= '?userlist=' . $userid;
	$user = file_get_contents(INTERFOLIO_HOST . $request_string, false, $context);

    return json_decode($user);
}
add_action('rest_api_init', function () {
  register_rest_route( 'wp-f180/v1', '/userdata/(?P<userid>[a-zA-Z0-9]+)', array(
    'methods' => 'GET',
    'callback' => 'f180GetUserData',
  ));
});
