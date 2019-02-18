import { Pipe, PipeTransform } from '@angular/core';
import { Player, filterPlayerArray } from '../shared/player.model';

@Pipe({
  name: 'playerFilter'
})
export class PlayerFilterPipe implements PipeTransform {

  transform(items: Player[], searchedValue: string): any {
    return filterPlayerArray(items, searchedValue);
  }

}
