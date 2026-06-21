export const BOARD_SIZE = 40;
export const GRID_SIZE = 11;

export const SPACES = [
  { id: 0, name: 'GO', type: 'go', group: null, color: null, price: 0 },
  { id: 1, name: 'Mediterranean Avenue', type: 'property', group: 'brown', color: '#8B4513', price: 60, rent: [2, 10, 30, 90, 160, 250], buildCost: 50 },
  { id: 2, name: 'Community Chest', type: 'community_chest', group: null, color: null, price: 0 },
  { id: 3, name: 'Baltic Avenue', type: 'property', group: 'brown', color: '#8B4513', price: 60, rent: [4, 20, 60, 180, 320, 450], buildCost: 50 },
  { id: 4, name: 'Income Tax', type: 'tax', group: null, color: null, price: 0, taxAmount: 200 },
  { id: 5, name: 'Reading Railroad', type: 'railroad', group: 'railroad', color: '#000', price: 200 },
  { id: 6, name: 'Oriental Avenue', type: 'property', group: 'light_blue', color: '#87CEEB', price: 100, rent: [6, 30, 90, 270, 400, 550], buildCost: 50 },
  { id: 7, name: 'Chance', type: 'chance', group: null, color: null, price: 0 },
  { id: 8, name: 'Vermont Avenue', type: 'property', group: 'light_blue', color: '#87CEEB', price: 100, rent: [6, 30, 90, 270, 400, 550], buildCost: 50 },
  { id: 9, name: 'Connecticut Avenue', type: 'property', group: 'light_blue', color: '#87CEEB', price: 120, rent: [8, 40, 100, 300, 450, 600], buildCost: 50 },
  { id: 10, name: 'Jail / Just Visiting', type: 'jail', group: null, color: null, price: 0 },
  { id: 11, name: 'St. Charles Place', type: 'property', group: 'pink', color: '#FF69B4', price: 140, rent: [10, 50, 150, 450, 625, 750], buildCost: 100 },
  { id: 12, name: 'Electric Company', type: 'utility', group: 'utility', color: '#fff', price: 150 },
  { id: 13, name: 'States Avenue', type: 'property', group: 'pink', color: '#FF69B4', price: 140, rent: [10, 50, 150, 450, 625, 750], buildCost: 100 },
  { id: 14, name: 'Virginia Avenue', type: 'property', group: 'pink', color: '#FF69B4', price: 160, rent: [12, 60, 180, 500, 700, 900], buildCost: 100 },
  { id: 15, name: 'Pennsylvania Railroad', type: 'railroad', group: 'railroad', color: '#000', price: 200 },
  { id: 16, name: 'St. James Place', type: 'property', group: 'orange', color: '#FF8C00', price: 180, rent: [14, 70, 200, 550, 750, 950], buildCost: 100 },
  { id: 17, name: 'Community Chest', type: 'community_chest', group: null, color: null, price: 0 },
  { id: 18, name: 'Tennessee Avenue', type: 'property', group: 'orange', color: '#FF8C00', price: 180, rent: [14, 70, 200, 550, 750, 950], buildCost: 100 },
  { id: 19, name: 'New York Avenue', type: 'property', group: 'orange', color: '#FF8C00', price: 200, rent: [16, 80, 220, 600, 800, 1000], buildCost: 100 },
  { id: 20, name: 'Free Parking', type: 'free_parking', group: null, color: null, price: 0 },
  { id: 21, name: 'Kentucky Avenue', type: 'property', group: 'red', color: '#FF0000', price: 220, rent: [18, 90, 250, 700, 875, 1050], buildCost: 150 },
  { id: 22, name: 'Chance', type: 'chance', group: null, color: null, price: 0 },
  { id: 23, name: 'Indiana Avenue', type: 'property', group: 'red', color: '#FF0000', price: 220, rent: [18, 90, 250, 700, 875, 1050], buildCost: 150 },
  { id: 24, name: 'Illinois Avenue', type: 'property', group: 'red', color: '#FF0000', price: 240, rent: [20, 100, 300, 750, 925, 1100], buildCost: 150 },
  { id: 25, name: 'B&O Railroad', type: 'railroad', group: 'railroad', color: '#000', price: 200 },
  { id: 26, name: 'Atlantic Avenue', type: 'property', group: 'yellow', color: '#FFD700', price: 260, rent: [22, 110, 330, 800, 975, 1150], buildCost: 150 },
  { id: 27, name: 'Ventnor Avenue', type: 'property', group: 'yellow', color: '#FFD700', price: 260, rent: [22, 110, 330, 800, 975, 1150], buildCost: 150 },
  { id: 28, name: 'Water Works', type: 'utility', group: 'utility', color: '#fff', price: 150 },
  { id: 29, name: 'Marvin Gardens', type: 'property', group: 'yellow', color: '#FFD700', price: 280, rent: [24, 120, 360, 850, 1025, 1200], buildCost: 150 },
  { id: 30, name: 'Go To Jail', type: 'go_to_jail', group: null, color: null, price: 0 },
  { id: 31, name: 'Pacific Avenue', type: 'property', group: 'green', color: '#00AA00', price: 300, rent: [26, 130, 390, 900, 1100, 1275], buildCost: 200 },
  { id: 32, name: 'North Carolina Avenue', type: 'property', group: 'green', color: '#00AA00', price: 300, rent: [26, 130, 390, 900, 1100, 1275], buildCost: 200 },
  { id: 33, name: 'Community Chest', type: 'community_chest', group: null, color: null, price: 0 },
  { id: 34, name: 'Pennsylvania Avenue', type: 'property', group: 'green', color: '#00AA00', price: 320, rent: [28, 150, 450, 1000, 1200, 1400], buildCost: 200 },
  { id: 35, name: 'Short Line', type: 'railroad', group: 'railroad', color: '#000', price: 200 },
  { id: 36, name: 'Chance', type: 'chance', group: null, color: null, price: 0 },
  { id: 37, name: 'Park Place', type: 'property', group: 'dark_blue', color: '#00008B', price: 350, rent: [35, 175, 500, 1100, 1300, 1500], buildCost: 200 },
  { id: 38, name: 'Luxury Tax', type: 'tax', group: null, color: null, price: 0, taxAmount: 100 },
  { id: 39, name: 'Boardwalk', type: 'property', group: 'dark_blue', color: '#00008B', price: 400, rent: [50, 200, 600, 1400, 1700, 2000], buildCost: 200 },
];

export const COLOR_GROUPS = {
  brown: { name: 'Brown', color: '#8B4513', propertyCount: 2 },
  light_blue: { name: 'Light Blue', color: '#87CEEB', propertyCount: 3 },
  pink: { name: 'Pink', color: '#FF69B4', propertyCount: 3 },
  orange: { name: 'Orange', color: '#FF8C00', propertyCount: 3 },
  red: { name: 'Red', color: '#FF0000', propertyCount: 3 },
  yellow: { name: 'Yellow', color: '#FFD700', propertyCount: 3 },
  green: { name: 'Green', color: '#00AA00', propertyCount: 3 },
  dark_blue: { name: 'Dark Blue', color: '#00008B', propertyCount: 2 },
  railroad: { name: 'Railroad', color: '#000', propertyCount: 4 },
  utility: { name: 'Utility', color: '#fff', propertyCount: 2 },
};

export const TOKENS = ['top_hat', 'car', 'dog', 'iron', 'battleship', 'thimble'];

export const COMMUNITY_CHEST = [
  { id: 0, text: 'Advance to GO. Collect $200.', action: 'advance_to_go' },
  { id: 1, text: 'Bank error in your favor. Collect $200.', action: 'collect', value: 200 },
  { id: 2, text: "Doctor's fee. Pay $50.", action: 'pay', value: 50 },
  { id: 3, text: 'From sale of stock you get $50.', action: 'collect', value: 50 },
  { id: 4, text: 'Get Out of Jail Free.', action: 'get_out_of_jail' },
  { id: 5, text: 'Go to Jail. Go directly to Jail.', action: 'go_to_jail' },
  { id: 6, text: 'Grand opera night. Collect $50 from every player.', action: 'collect_from_all', value: 50 },
  { id: 7, text: 'Holiday fund matures. Collect $100.', action: 'collect', value: 100 },
  { id: 8, text: 'Income tax refund. Collect $20.', action: 'collect', value: 20 },
  { id: 9, text: 'Life insurance matures. Collect $100.', action: 'collect', value: 100 },
  { id: 10, text: 'Hospital fees. Pay $100.', action: 'pay', value: 100 },
  { id: 11, text: 'School fees. Pay $50.', action: 'pay', value: 50 },
  { id: 12, text: 'Consultancy fee. Collect $25.', action: 'collect', value: 25 },
  { id: 13, text: 'You are assessed for street repairs. Pay $40 per house, $115 per hotel.', action: 'street_repair', perHouse: 40, perHotel: 115 },
  { id: 14, text: 'You have won second prize in a beauty contest. Collect $10.', action: 'collect', value: 10 },
  { id: 15, text: 'You inherit $100.', action: 'collect', value: 100 },
];

export const CHANCE = [
  { id: 0, text: 'Advance to GO. Collect $200.', action: 'advance_to_go' },
  { id: 1, text: 'Advance to Illinois Avenue.', action: 'advance_to', value: 24 },
  { id: 2, text: 'Advance to St. Charles Place.', action: 'advance_to', value: 11 },
  { id: 3, text: 'Advance token to nearest Utility.', action: 'advance_nearest_utility' },
  { id: 4, text: 'Advance token to the nearest Railroad.', action: 'advance_nearest_railroad' },
  { id: 5, text: 'Bank pays you a dividend of $50.', action: 'collect', value: 50 },
  { id: 6, text: 'Get Out of Jail Free.', action: 'get_out_of_jail' },
  { id: 7, text: 'Go Back 3 Spaces.', action: 'go_back', value: 3 },
  { id: 8, text: 'Go to Jail. Go directly to Jail.', action: 'go_to_jail' },
  { id: 9, text: 'Make general repairs on all your property. Pay $25 per house, $100 per hotel.', action: 'street_repair', perHouse: 25, perHotel: 100 },
  { id: 10, text: 'Pay poor tax of $15.', action: 'pay', value: 15 },
  { id: 11, text: 'Take a trip to Reading Railroad.', action: 'advance_to', value: 5 },
  { id: 12, text: 'Take a walk on the Boardwalk.', action: 'advance_to', value: 39 },
  { id: 13, text: 'You have been elected Chairman of the Board. Pay each player $50.', action: 'pay_each', value: 50 },
  { id: 14, text: 'Your building loan matures. Collect $150.', action: 'collect', value: 150 },
  { id: 15, text: 'You have won a crossword competition. Collect $100.', action: 'collect', value: 100 },
];

export const GRID_POSITIONS = [
  { pos: 0, x: 10, y: 10 }, { pos: 1, x: 9, y: 10 }, { pos: 2, x: 8, y: 10 }, { pos: 3, x: 7, y: 10 },
  { pos: 4, x: 6, y: 10 }, { pos: 5, x: 5, y: 10 }, { pos: 6, x: 4, y: 10 }, { pos: 7, x: 3, y: 10 },
  { pos: 8, x: 2, y: 10 }, { pos: 9, x: 1, y: 10 }, { pos: 10, x: 0, y: 10 }, { pos: 11, x: 0, y: 9 },
  { pos: 12, x: 0, y: 8 }, { pos: 13, x: 0, y: 7 }, { pos: 14, x: 0, y: 6 }, { pos: 15, x: 0, y: 5 },
  { pos: 16, x: 0, y: 4 }, { pos: 17, x: 0, y: 3 }, { pos: 18, x: 0, y: 2 }, { pos: 19, x: 0, y: 1 },
  { pos: 20, x: 0, y: 0 }, { pos: 21, x: 1, y: 0 }, { pos: 22, x: 2, y: 0 }, { pos: 23, x: 3, y: 0 },
  { pos: 24, x: 4, y: 0 }, { pos: 25, x: 5, y: 0 }, { pos: 26, x: 6, y: 0 }, { pos: 27, x: 7, y: 0 },
  { pos: 28, x: 8, y: 0 }, { pos: 29, x: 9, y: 0 }, { pos: 30, x: 10, y: 0 }, { pos: 31, x: 10, y: 1 },
  { pos: 32, x: 10, y: 2 }, { pos: 33, x: 10, y: 3 }, { pos: 34, x: 10, y: 4 }, { pos: 35, x: 10, y: 5 },
  { pos: 36, x: 10, y: 6 }, { pos: 37, x: 10, y: 7 }, { pos: 38, x: 10, y: 8 }, { pos: 39, x: 10, y: 9 },
];

export const COMMUNITY_CHEST_DECK = [...COMMUNITY_CHEST];
export const CHANCE_DECK = [...CHANCE];

export const STARTING_CASH = 1500;
export const GO_SALARY = 200;
export const JAIL_BAIL = 50;
export const MAX_JAIL_TURNS = 3;
export const MAX_CONSECUTIVE_DOUBLES = 3;
export const BANKRUPTCY_LIMIT = 3;
