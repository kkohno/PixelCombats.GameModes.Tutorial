import * as room from 'pixel_combats/room';
import * as peace from './options.js';
import * as teams from './default_teams.js';
const { log } = await import('pixel_combats/debug');
import * as basic from 'pixel_combats/basic';
import * as library from './library.js';

// разрешения
room.Damage.FriendlyFire = false;
room.BreackGraph.OnlyPlayerBlocksDmg = false;
room.BreackGraph.WeakBlocks = false;
// делаем возможным ломать все блоки
room.BreackGraph.BreackAll = true;
// показываем количество квадов
room.Ui.GetContext().QuadsCount.Value = false;
// разрешаем все чистые блоки
//room.Build.GetContext().BlocksSet.Value = room.BuildBlocksSet.AllClear;
// вкл строительные опции
//peace.set_editor_options();

// запрет нанесения урона
room.Damage.GetContext().DamageOut.Value = false;

// параметры игры
room.Properties.GetContext().GameModeName.Value = "GameModes/TUTORIAL";
// создаем команду
const blue_team = teams.create_team_blue();
blue_team.Build.BlocksSet.Value = room.BuildBlocksSet.Blue;

// разрешаем вход в команды по запросу
room.Teams.OnRequestJoinTeam.add_Event(function (player, team) { team.Add(player); });
// спавн по входу в команду
room.Teams.OnPlayerChangeTeam.add_Event(function (player) { player.Spawns.Spawn(); });

// задаем подсказку
room.Ui.getContext().Hint.Value = "Hint/TutorialGoToAreaStart";

// конфигурация инвентаря
peace.set_inventory();

// моментальный спавн
room.Spawns.GetContext().RespawnTime.Value = 0;
room.Damage.OnDeath.Add(function (player) {
    player.Spawns.Spawn();
});

room.Map.OnLoad.Add(() => {
    for (let player of room.Players.All) 
        blue_team.Add(player);
    room.Spawns.GetContext().Spawn();
});
room.Players.OnPlayerConnected.Add((player) => {
    blue_team.Add(player);
});