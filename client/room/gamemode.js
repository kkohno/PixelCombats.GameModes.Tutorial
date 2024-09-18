import * as room from 'pixel_combats/room';
import * as peace from './options.js';
import * as teams from './default_teams.js';
const { log } = await import('pixel_combats/debug');
import * as basic from 'pixel_combats/basic';
import * as library from './library.js';

// опции
/*const TRIGGERS_TAG = "trigger";
const BOTS_SPAWN_TAG = "bots";
const BOTS_MULTI_SPAWN_TAG = "multi";*/

log.debug('library.trigger_index.Value ' + library.trigger_index.Value);

// визуализация триггера
/*var trigger_view = room.AreaViewService.GetContext().Get("trigger_view");
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
});*/

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