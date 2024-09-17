import * as room from 'pixel_combats/room';

// получает все зоны с указанным тэгом, сортировано по имени
export function get_areas_by_tag_sorted_by_name(tag) {
    var areas = room.AreaService.GetByTag(tag);
    // ограничитель
    if (areas == null || areas.length == 0) return areas;
    // сортировка зон
    areas.sort(function (a, b) {
        if (a.Name > b.Name) return 1;
        if (a.Name < b.Name) return -1;
        return 0;
    });
    return areas;
}

export function spawn_bots_in_area_range(range) {
    var count = 0;
    var bots = [];
    var spawn_data = {};
    for (var x = range.Start.x; x < range.End.x; x += 2)
        for (var z = range.Start.z; z < range.End.z; z += 2) {
            spawn_data.Position = new basic.Vector3(x + 0.5, range.Start.y, z + 0.5);
            spawn_data.LookAt = player.Position;
            spawn_data.LookAt.y += PLAYER_HEAD_HEIGHT;
            const bot = room.Bots.CreateHuman(spawn_data);
            if (bot !== null) { // если не сервер то бот не будет создан, потому ОБЯЗАТЕЛЬНО проверить нет ли тут нуля, иначе код дальше упадет
                bots.push(bot);
                bot.Attack = NEW_BOT_IS_ATTACK; // первый способ настройки ботов - сразу по дескриптору нового бота (смотреть чтобы дескриптор небыл null)
                bot.WeaponId = weapon++ % 20;
            }

            ++count;
        }
    return bots;
}
export function spawn_bots_in_area_all_ranges(area) {
    var weapon = 1;
    var count = 0;
    var bots = [];

    for (const range in area.Ranges.All) {
        spawn_bots_in_area_range(range);
    }

    return bots;
}