import * as room from 'pixel_combats/room';
import * as peace from './options.js';
import * as teams from './default_teams.js';
const { log } = await import('pixel_combats/debug');
import * as basic from 'pixel_combats/basic';

// опции
const TRIGGERS_TAG = "trigger_1";
const BOTS_SPAWN_TAG = "bots_1";

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
    var spawns = room.AreaService.GetByTag(BOTS_SPAWN_TAG);
    var weapon = 1;
    for (var i = 0; i < spawns.length; ++i) {
        var range = spawns[i].Ranges.All[0];
        var spawn_data = { WeaponId: weapon };
        for (var x = range.Start.x; x < range.End.x; x += 2)
            for (var z = range.Start.z; z < range.End.z; z += 2) {
                spawn_data.WeaponId = weapon++ % 20;
                spawn_data.Position = new basic.Vector3(x, range.Start.y, z);
                spawn_data.LookAt = player.Position;
                spawn_data.LookAt.y += 1.5;
                room.Bots.CreateHuman(spawn_data);
                //var bot = room.Bots.CreateHuman(spawn_data);
                //bot.Attack = true;
            }
    }
    trigger.Enable = false;
    trigger_view.Enable = false;
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
