/**
 * @file Button.jsx
 * @description Reusable Button component with both named and default exports.
 */
import { Button as UIButton } from '@/components/ui/button';

export function Button(props) {
  return <UIButton {...props} />;
}

export default Button;
