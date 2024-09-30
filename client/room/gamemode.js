import * as room from 'pixel_combats/room';
import * as peace from './options.js';
import * as teams from './default_teams.js';
const { log } = await import('pixel_combats/debug');
import * as basic from 'pixel_combats/basic';
import * as library from './library.js';

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
// создаем команду
teams.create_team_blue();

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
room.Damage.OnDeath.Add(function (player) {
	player.Spawns.Spawn();
});
Spawns.GetContext().Spawn();