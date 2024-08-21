import * as room from 'pixel_combats/room';
import * as peace from './options.js';
import * as teams from './default_teams.js';

const TRIGGERS_TAG = "trigger_1";
const BOTS_SPAWN_TAG = "bots_1";
//var triggers = room.AreaService.GetByTag(TRIGGERS_TAG);
var trigger = room.AreaPlayerTriggerService.Get("players_trigger");
var spawns = room.AreaService.GetByTag(BOTS_SPAWN_TAG);
trigger.Tags = [TRIGGERS_TAG];
trigger.Enable = true;
trigger.OnEnter.Add(function (player, area, trigger) {
    console.log(spawns);
    var range = spawns[0].Ranges.All[0];
    var spawn_data = { WeaponId: 2 };
    spawn_data.Position = range.Start;
    room.Bots.CreateHuman(spawn_data);
    trigger.Enable = false;
});

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
peace.set_editor_inventory();

// моментальный спавн
room.Spawns.GetContext().RespawnTime.Value = 0;
