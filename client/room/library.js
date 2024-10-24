import * as room from 'pixel_combats/room';
import * as basic from 'pixel_combats/basic';
const { log } = await import('pixel_combats/debug');

const BOTS_SPAWN_TAG = "bots";
const TRIGGERS_TAG = "trigger";
const BOTS_MULTI_SPAWN_TAG = "multi";
const ANALYTICS_ENABLE = "analytics";
const NEW_BOT_IS_ATTACK = true; // если истина то новые боты атакуют
const BOTS_POOL_SIZE = 10; // размер пула ботов
const MAX_SPAWNS_BY_AREA = 20; // максимум спавнов в зоне
const BOTS_SKIN_ID = 10;
export const PLAYER_HEAD_HEIGHT = 2.35; // высота середины головы игрока от его ног
var bots_configured = 0;
export const trigger_index = room.Properties.GetContext().Get("trigger_index");
trigger_index.Value = 0;
const BOT_WEAPONS = [2, 18, 1, 27, 3, 28, 29, 14, 21, 13, 4, 16, 36, 30, 9, 15, 31, 32, 33, 22, 7, 34, 17, 35];
const ROOM_CLOSE_TIME = 10;
const timer = room.Timers.GetContext().Get("Main");

const analytics_enable = room.GameMode.Parameters.GetBool(ANALYTICS_ENABLE);

// задаем размер пула ботов
room.Bots.PoolSize = BOTS_POOL_SIZE;

// визуализатор триггера игроков
const players_trigger_view = room.AreaViewService.GetContext().Get("players_trigger_view");
// триггер игроков
const players_trigger = room.AreaPlayerTriggerService.Get("players_trigger");
players_trigger.OnEnter.Add(function (player, area, trigger) {
    if (analytics_enable) room.Analytics.LogEvent("tutorial", 
        new basic.AnalyticsParameter("event_type", "trigger"), 
        new basic.AnalyticsParameter("value", trigger_index.Value.ToString()));
    const area = bots_spawns_areas[trigger_index.Value];
    for (const bot of spawn_bots_in_area_all_ranges(area)) {
        configure_bot(bot);
    }
    players_trigger.Enable = false;
    players_trigger_view.Enable = false;
    set_spawn_index(trigger_index.Value);
});

// инициализация всего что зависит от карты
var trigger_areas = get_areas_by_tag_sorted_by_name(TRIGGERS_TAG);
var bots_spawns_areas = get_areas_by_tag_sorted_by_name(BOTS_SPAWN_TAG);
room.Map.OnLoad.Add(InitializeFromMap);
function InitializeFromMap() {
    trigger_areas = get_areas_by_tag_sorted_by_name(TRIGGERS_TAG);
    bots_spawns_areas = get_areas_by_tag_sorted_by_name(BOTS_SPAWN_TAG);
    for (let i = 0; i < trigger_areas.length; ++i) {
        trigger_areas[i].Enable = i == trigger_index.Value;
    }
    for (let i = 0; i < bots_spawns_areas.length; ++i) {
        bots_spawns_areas[i].Enable = i == trigger_index.Value;
    }
    trigger_set_enable(0);
}
InitializeFromMap(); // todo регламентировать последовательность отработки режима и карты. Тут чтото нужно придумать, как бы реализовать четкую последовательность отработки скриптов и загрузки карт, возможно стоит сделать какието модули с выгружаемыми дескрипторами соответствующих функций. этот вопрос стоит обсудить с разработчиками режимов и разработчиками игры

// отработка появления и смерти ботов
room.Bots.OnNewBot.Add(function (bot) {
    //ShowBotsCount();
    //bot.Attack = library.NEW_BOT_IS_ATTACK; // это второй способ настройки ботов
});
room.Bots.OnBotDeath.Add(function (bot) {
    if (room.Bots.Alive.length == 0) ++trigger_index.Value;
    if (trigger_index.Value >= bots_spawns_areas.length) {
        room.Ui.GetContext().Hint.Value = "Hint/TutorialEnd";
        room.Ui.GetContext().MainTimerId.Value = timer.Id;
        timer.Restart(ROOM_CLOSE_TIME);
    }
    else {
        ShowBotsCount();
    }
});
timer.OnTimer.Add(function () {
    if (analytics_enable) room.Analytics.LogEvent("tutorial", 
        new basic.AnalyticsParameter("event_type", "close"));
    room.Room.Close();
});

// отображение текущего количества ботов
const bots_timer = room.Timers.GetContext().Get("bots_timer");
function ShowBotsCount() {
    //room.Ui.GetContext().Hint.Value = "Bots count: " + room.Bots.Alive.length;
    if (room.Bots.Alive.length == 1) room.Ui.GetContext().Hint.Value = "Hint/AttackTheEnemy";
    else if (room.Bots.Alive.length > 1) room.Ui.GetContext().Hint.Value = "Hint/AttackTheEnemies";
    else if (room.Bots.Alive.length == 0) room.Ui.GetContext().Hint.Value = "Hint/TutorialGoToArea";
}
bots_timer.OnTimer.Add(function () {
    var player = room.Players.All[0];
    var look = player.Position;
    look.y += PLAYER_HEAD_HEIGHT;
    for (const bot of room.Bots.All) {
        bot.LookAt(look);
    }
    //ShowBotsCount();
});
bots_timer.RestartLoop(1);

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
    var bots = [];
    var player = room.Players.All[0];
    for (var x = range.Start.x; x < range.End.x; x += 2)
        for (var z = range.Start.z; z < range.End.z; z += 2) {
            const spawn_data = {
                Position: new basic.Vector3(x + 0.5, range.Start.y, z + 0.5),
                LookAt: player.Position,
                SkinId: BOTS_SKIN_ID
            };
            spawn_data.LookAt.y += PLAYER_HEAD_HEIGHT;
            const bot = room.Bots.CreateHuman(spawn_data);
            if (bot !== null) {
                //bot.SkinId = BOTS_SKIN_ID;
                bots.push(bot);// если не сервер то бот не будет создан, потому ОБЯЗАТЕЛЬНО проверить нет ли тут нуля, иначе код дальше упадет
            }
        }
    ShowBotsCount();
    return bots;
}

export function spawn_bots_in_area_all_ranges(area) {
    var bots = [];
    for (const range of area.Ranges.All) {
        for (const bot of spawn_bots_in_area_range(range))
            bots.push(bot);
    }
    return bots;
}

export function configure_bot(bot) {
    if (bot == null) return;
    bot.WeaponId = BOT_WEAPONS[bots_configured++ % BOT_WEAPONS.length];
    bot.Attack = NEW_BOT_IS_ATTACK; // первый способ настройки ботов - сразу по дескриптору нового бота (смотреть чтобы дескриптор небыл null)
}

// активация триггеров на карте
trigger_index.OnValue.Add(prop => {
    trigger_set_enable(prop.Value);
});
function trigger_set_enable(index) { // активирует триггер указанного индекса, если задать отрицательное число, то деактивирует триггер
    if (index >= trigger_areas.length) index = -1;
    if (index >= 0) {
        const area = trigger_areas[index];
        players_trigger_view.Color = new basic.Color(1, 1, 0, 0);
        players_trigger_view.Area = area;
        players_trigger_view.Enable = true;

        players_trigger.Area = area;
        players_trigger.Enable = true;
    }
    else {
        players_trigger_view.Enable = false;
        players_trigger.Enable = false;
    }
}

export function set_spawn_index(index) {
    if (index < 0 || index >= trigger_areas.length) return;
    const apawn_area = trigger_areas[index];
    const look_area = index == trigger_areas.length - 1 ? bots_spawns_areas[index] : trigger_areas[index + 1];
    const look_point = look_area.Ranges.GetAveragePosition();
    set_spawn_area(trigger_areas[index], look_point);
}
export function set_spawn_area(spawn_area, look_point) {
    const spawns = room.Spawns.GetContext();
    // очистка спавнов
    spawns.CustomSpawnPoints.Clear();
    // задаем спавны
    const range = spawn_area.Ranges.All[0];
    // определяем куда смотреть спавнам
    var spawnsCount = 0;
    for (var x = range.Start.x; x < range.End.x; x += 2)
        for (var z = range.Start.z; z < range.End.z; z += 2) {
            //log.debug('ADD_SPAWN ' + x + '; ' + range.Start.y + '; ' + z);
            spawns.CustomSpawnPoints.Add(x, range.Start.y, z,
                room.Spawns.GetSpawnRotation(x, z, look_point.x, look_point.z));
            ++spawnsCount;
            if (spawnsCount > MAX_SPAWNS_BY_AREA) return;
        }
}
