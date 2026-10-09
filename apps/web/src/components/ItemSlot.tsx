import { gameData } from '@ragidle/game-data';
import { cn } from '@ragidle/ui';
import { CATEGORY_ICON, itemTextClass } from '../presentation/icons';

/** Square item tile with a quantity corner, like an RO inventory cell. */
export function ItemSlot(props: { itemId: string; quantity?: number; className?: string }) {
  const item = gameData.items[props.itemId];
  const Icon = item ? CATEGORY_ICON[item.category] : CATEGORY_ICON.material;
  const name = item?.name ?? props.itemId;
  return (
    <div
      title={props.quantity ? `${name} × ${props.quantity}` : name}
      className={cn(
        'relative grid aspect-square place-items-center rounded-control border border-line bg-surface-sunken',
        item?.category === 'card' && 'border-card/60',
        props.className,
      )}
    >
      <Icon aria-hidden className={cn('size-5', itemTextClass(item))} />
      <span className="sr-only">{name}</span>
      {props.quantity !== undefined && props.quantity > 1 && (
        <span className="absolute right-1 bottom-0.5 text-[10px] font-semibold text-text-soft tabular-nums">
          {props.quantity}
        </span>
      )}
    </div>
  );
}
