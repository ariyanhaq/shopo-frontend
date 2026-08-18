/**
 * @file Card.jsx
 * @description Reusable Card component with both named and default exports.
 */
import { Card as UICard } from '@/components/ui/card';

export function Card(props) {
  return <UICard {...props} />;
}

export default Card;
