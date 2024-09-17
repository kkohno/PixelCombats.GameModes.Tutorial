import * as room from 'pixel_combats/room';
import * as peace from './options.js';
import * as teams from './default_teams.js';
const { log } = await import('pixel_combats/debug');
import * as basic from 'pixel_combats/basic';
import * as library from './library.js';

// опции
const TRIGGERS_TAG = "trigger";
const BOTS_SPAWN_TAG = "bots";
const BOTS_MULTI_SPAWN_TAG = "multi";
const BOTS_POOL_SIZE = 10; // размер пула ботов

// инициализация всего что зависит от карты
var triggers = library.get_areas_by_tag_sorted_by_name(TRIGGERS_TAG);
var bots_spawns = library.get_areas_by_tag_sorted_by_name(BOTS_SPAWN_TAG);
room.Map.OnLoad.Add(InitializeFromMap);
function InitializeFromMap() {
    triggers = library.get_areas_by_tag_sorted_by_name(TRIGGERS_TAG);
    bots_spawns = library.get_areas_by_tag_sorted_by_name(BOTS_SPAWN_TAG);
}

// задаем размер пула ботов
room.Bots.PoolSize = BOTS_POOL_SIZE;

// визуализация триггера
var trigger_view = room.AreaViewService.GetContext().Get("trigger_view");
trigger_view.color = new basic.Color(1, 1, 0, 0);
trigger_view.Tags = [TRIGGERS_TAG];
trigger_view.Enable = true;

// зоны спавна
var trigger = room.AreaPlayerTriggerService.Get("players_trigger");
trigger.Tags = [TRIGGERS_TAG];
trigger.Enable = true;
trigger.OnEnter.Add(function (player, area, trigger) {
    for (const spawn of room.AreaService.GetByTag(BOTS_SPAWN_TAG)) {
        for (const bot of library.spawn_bots_in_area_all_ranges(spawn)) {
            configure_bot(bot);
        }
    }
    /*var spawns = room.AreaService.GetByTag(BOTS_SPAWN_TAG);
    var weapon = 1;
    var count = 0;
    for (var i = 0; i < spawns.length; ++i) {
        var range = spawns[i].Ranges.All[0];
        var spawn_data = { WeaponId: weapon };
        for (var x = range.Start.x; x < range.End.x; x += 2)
            for (var z = range.Start.z; z < range.End.z; z += 2) {
                //spawn_data.WeaponId = weapon++ % 20;
                spawn_data.Position = new basic.Vector3(x + 0.5, range.Start.y, z + 0.5);
                spawn_data.LookAt = player.Position;
                spawn_data.LookAt.y += PLAYER_HEAD_HEIGHT;
                const bot = room.Bots.CreateHuman(spawn_data);
                if (bot !== null) { // если не сервер то бот не будет создан, потому ОБЯЗАТЕЛЬНО проверить нет ли тут нуля, иначе код дальше упадет
                    bot.Attack = NEW_BOT_IS_ATTACK; // первый способ настройки ботов - сразу по дескриптору нового бота (смотреть чтобы дескриптор небыл null)
                    bot.WeaponId = weapon++ % 20;
                }

                ++count;
            }
    }*/
    trigger.Enable = false;
    trigger_view.Enable = false;
    room.Ui.GetContext().Hint.Value = "Bots count: " + count;
});

room.Bots.OnNewBot.Add(function (bot) {
    //bot.Attack = NEW_BOT_IS_ATTACK; // это второй способ настройки ботов
});
room.Bots.OnBotDeath.Add(function (bot) {
    room.Ui.GetContext().Hint.Value = "Bots count: " + room.Bots.Alive.length;
});

var bots_timer = room.Timers.GetContext().Get("bots_timer");
bots_timer.OnTimer.Add(function () {
    var player = room.Players.All[0];
    var look = player.Position;
    look.y += library.PLAYER_HEAD_HEIGHT;
    for (const bot of room.Bots.All) {
        bot.LookAt(look);
    }
    room.Ui.GetContext().Hint.Value = "Bots count: " + room.Bots.Alive.length;
});
bots_timer.RestartLoop(1);

// разрешения
room.Damage.FriendlyFire = false;
room.BreackGraph.OnlyPlayerBlocksDmg = false;
room.BreackGraph.WeakBlocks = true;
// делаем возможным ломать все блоки
room.BreackGraph.BreackAll = true;
// показываем количество квадов
room.Ui.GetContext().QuadsCount.Value = true;
// разрешаем все чистые блоки
room.Build.GetContext().BlocksSet.Value = room.BuildBlocksSet.AllClear;
// вкл строительные опции
peace.set_editor_options();

// запрет нанесения урона
room.Damage.GetContext().DamageOut.Value = false;

// параметры игры
room.Properties.GetContext().GameModeName.Value = "GameModes/EDITOR";
// создаем команды
var red = room.GameMode.Parameters.GetBool("RedTeam");
var blue = room.GameMode.Parameters.GetBool("BlueTeam");
if (red || !red && !blue) teams.create_team_red();
if (blue || !red && !blue) teams.create_team_blue();

// разрешаем вход в команды по запросу
room.Teams.OnRequestJoinTeam.add_Event(function (player, team) { team.Add(player); });
// спавн по входу в команду
room.Teams.OnPlayerChangeTeam.add_Event(function (player) { player.Spawns.Spawn(); });

// задаем подсказку
room.Ui.getContext().Hint.Value = "Hint/BuildBase";

// конфигурация инвентаря
peace.set_inventory();

// моментальный спавн
room.Spawns.GetContext().RespawnTime.Value = 0;