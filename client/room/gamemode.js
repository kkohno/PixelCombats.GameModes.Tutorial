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

log.debug('library.trigger_index.Value ' + library.trigger_index.Value);

// инициализация всего что зависит от карты
var triggers = library.get_areas_by_tag_sorted_by_name(TRIGGERS_TAG);
var bots_spawns = library.get_areas_by_tag_sorted_by_name(BOTS_SPAWN_TAG);
room.Map.OnLoad.Add(InitializeFromMap);
function InitializeFromMap() {
    triggers = library.get_areas_by_tag_sorted_by_name(TRIGGERS_TAG);
    bots_spawns = library.get_areas_by_tag_sorted_by_name(BOTS_SPAWN_TAG);
    for (let i = 0; i < triggers.length; ++i) {
        triggers[i].Enable = i == library.trigger_index.Value;
    }
    for (let i = 0; i < bots_spawns.length; ++i) {
        bots_spawns[i].Enable = i == library.trigger_index.Value;
    }
}
InitializeFromMap(); // todo регламентировать последовательность отработки режима и карты. Тут чтото нужно придумать, как бы реализовать четкую последовательность отработки скриптов и загрузки карт, возможно стоит сделать какието модули с выгружаемыми дескрипторами соответствующих функций. этот вопрос стоит обсудить с разработчиками режимов и разработчиками игры

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
            library.configure_bot(bot);
        }
    }
    trigger.Enable = false;
    trigger_view.Enable = false;
});

room.Bots.OnNewBot.Add(function (bot) {
    //bot.Attack = library.NEW_BOT_IS_ATTACK; // это второй способ настройки ботов
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