/* Single import that makes @needle/ui-web visually self-contained:
 *   import '@needle/ui-web/styles';
 * Loads fonts (Fraunces / Geist / Geist Mono via @fontsource), then the
 * primitive tokens, semantic tokens, and base resets — in that order. */

import '@fontsource/fraunces/400.css';
import '@fontsource/fraunces/400-italic.css';
import '@fontsource/fraunces/600.css';
import '@fontsource/geist-sans/400.css';
import '@fontsource/geist-sans/500.css';
import '@fontsource/geist-sans/600.css';
import '@fontsource/geist-mono/400.css';

import './primitives.css';
import './tokens.css';
import './base.css';
