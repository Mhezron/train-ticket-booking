// Importing necessary modules from the 'azle' library and 'uuid' library
import {
  $query,
  $update,
  Record,
  StableBTreeMap,
  Vec,
  match,
  Result,
  nat64,
  ic,
  Opt,
  Principal,
} from "azle";
import { v4 as uuidv4 } from "uuid";

// Defining record types for different entities
type Station = Record<{
  id: string;
  station: Principal;
}>;

type Train = Record<{
  id: string;
  capacity: number;
  empty_seats: number;
  time: string;
  starting_point: string;
  stops: Vec<string>;
}>;

type Ticket = Record<{
  id: string;
  time: string;
  seat_no: number;
  train_id: string;
  traveller: Traveller;
  boarding: string;
  destination: string;
}>;

type Traveller = Record<{
  id: string;
  name: string;
  phone: string;
}>;

type TrainPayload = Record<{
  capacity: number;
  time: string;
  starting_point: string;
  stops: Vec<string>;
}>;

type TrainUpdatePayload = Record<{
  id: string;
  time: string;
  starting_point: string;
  stops: Vec<string>;
}>;

type TicketPayload = Record<{
  time: string;
  train_id: string;
  traveller_id: string;
  boarding: string;
  destination: string;
}>;

type TravellerPayload = Record<{
  name: string;
  phone: string;
}>;

type TrainSearchPayload = Record<{
  time: string;
  starting_point: string;
  destination: string;
}>;

// Creating instances of StableBTreeMap for each entity type
const stationStorage = new StableBTreeMap<string, Station>(0, 44, 512);
const ticketStorage = new StableBTreeMap<string, Ticket>(1, 44, 512);
const trainStorage = new StableBTreeMap<string, Train>(2, 44, 512);
const travellerStorage = new StableBTreeMap<string, Traveller>(3, 44, 512);

// Initialization of stationStorage
$update;
$update;
export function initStation(name: string): Result<Station, string> {
  try {
    // Validate that the station has not been initialized already
    if (!stationStorage.isEmpty()) {
      return Result.Err<Station, string>("Station has already been initialized");
    }

    // Validate that the provided name is not empty
    if (!name || name.trim() === "") {
      return Result.Err<Station, string>("Station name cannot be empty");
    }

    // Validate the uniqueness of the station name
    const existingStation = stationStorage.values()[0];
    if (existingStation && existingStation.station.toText() === name) {
      return Result.Err<Station, string>("Station with this name already exists");
    }

    // Create a new station
    const station: Station = {
      id: uuidv4(),
      station: ic.caller(),
    };

    // Insert the station into stationStorage
    stationStorage.insert(station.id, station);

    return Result.Ok(station);
  } catch (error) {
    return Result.Err<Station, string>("Failed to initialize station");
  }
}

// Function to check if the person making the request is the station
function isStation(caller: string): boolean {
  const station = stationStorage.values()[0];
  return station.station.toText() !== caller;
}

// Function to add train by station
$update;
export function addTrain(payload: TrainPayload): Result<Train, string> {
  try {
    // Validate that the station exists
    if (stationStorage.isEmpty()) {
      return Result.Err("Station has not been initialized");
    }

    // Validate that the person making the request is the station
    if (isStation(ic.caller().toText())) {
      return Result.Err("Only the station can add a train");
    }

    // Validate the payload
    if (
      !payload.capacity ||
      !payload.time ||
      !payload.starting_point ||
      !payload.stops
    ) {
      return Result.Err("Incomplete input data!");
    }

    // Create a new train
    const train: Train = {
      id: uuidv4(),
      capacity: payload.capacity,
      empty_seats: payload.capacity,
      time: payload.time,
      starting_point: payload.starting_point,
      stops: payload.stops,
    };

    // Insert the train into trainStorage
    trainStorage.insert(train.id, train);

    return Result.Ok(train);
  } catch (error) {
    return Result.Err("Failed to add train");
  }
}

$query;
// get train by Id
export function getTrainById(id: string): Result<Train, string> {
  return match(trainStorage.get(id), {
    Some: (train) => Result.Ok<Train, string>(train),
    None: () => Result.Err<Train, string>(`could not get train for ID: ${id}`),
  });
}

$query;
// Function to get available train seats
export function getTrainsEmptySeats(): Result<Vec<Train>, string> {
  try {
    const seats = trainStorage
      .values()
      .filter((train) => train.empty_seats > 0);

    // Check if there are available traveller seats
    if (seats.length === 0) {
      return Result.Err("No train with empty seats currently");
    }

    return Result.Ok(seats);
  } catch (error) {
    return Result.Err("Failed to get empty train seats");
  }
}

// Function to search train by time, strarting point and destination
$query;
export function searchTrain(
  payload: TrainSearchPayload
): Result<Vec<Train>, string> {
  try {
    const trains = trainStorage.values().filter((train) => {
      return (
        (train.time === payload.time &&
          train.starting_point === payload.starting_point &&
          train.stops.includes(payload.destination)) ||
        train.stops.includes(payload.starting_point)
      );
    });

    // Check if there are available traveller seats
    if (trains.length === 0) {
      return Result.Err("No train available for this route currently");
    }

    return Result.Ok(trains);
  } catch (error) {
    return Result.Err("Failed to get empty train seats");
  }
}

// Function to update train by station
$update;
$update;
export function updateTrain(payload: TrainUpdatePayload): Result<Train, string> {
  try {
    // Validate that the station exists
    if (stationStorage.isEmpty()) {
      return Result.Err<Train, string>("Station has not been initialized");
    }

    // Validate that the person making the request is the station
    if (isStation(ic.caller().toText())) {
      return Result.Err<Train, string>("Only the station can update a train");
    }

    // Validate the payload
    if (!payload || !payload.time || !payload.starting_point || !payload.stops) {
      return Result.Err<Train, string>("Incomplete input data!");
    }

    // Get the train
    const existingTrainResult = getTrainById(payload.id);
    if (existingTrainResult.isErr()) {
      return Result.Err<Train, string>(`Train of id: ${payload.id} not found`);
    }

    const existingTrain = existingTrainResult.unwrap();

    // Update the train
    existingTrain.time = payload.time;
    existingTrain.starting_point = payload.starting_point;
    existingTrain.stops = payload.stops;

    // Insert the updated train into trainStorage
    trainStorage.insert(existingTrain.id, existingTrain);

    return Result.Ok<Train, string>(existingTrain);
  } catch (error) {
    return Result.Err<Train, string>("Failed to update train");
  }
}


$update;
// Function to add a new traveller slot
export function addTraveller(
  payload: TravellerPayload
): Result<Traveller, string> {
  try {
    // Validate that the station exists
    if (stationStorage.isEmpty()) {
      return Result.Err("Station has not been initialized");
    }

    // Validate the payload
    if (!payload.name || !payload.phone) {
      return Result.Err("Incomplete input data!");
    }

    // Create a new traveller slot
    const traveller: Traveller = {
      id: uuidv4(),
      name: payload.name,
      phone: payload.phone,
    };

    // Insert the traveller slot into travellerStorage
    travellerStorage.insert(traveller.id, traveller);

    return Result.Ok(traveller);
  } catch (error) {
    return Result.Err("Failed to add traveller slot");
  }
}

// Function to get all travellers per train
$query;
export function getTravellersPerTrain(
  id: string
): Result<Vec<Traveller>, string> {
  try {
    const travellers = ticketStorage
      .values()
      .filter((ticket) => ticket.train_id === id)
      .map((ticket) => ticket.traveller);

    // Check if there are available traveller seats
    if (travellers.length === 0) {
      return Result.Err("No travellers on this train currently");
    }

    return Result.Ok(travellers);
  } catch (error) {
    return Result.Err("Failed to get travellers");
  }
}

// function to get traveller by ID
$query;
export function getTravellerById(id: string): Result<Traveller, string> {
  return match(travellerStorage.get(id), {
    Some: (traveller) => Result.Ok<Traveller, string>(traveller),
    None: () =>
      Result.Err<Traveller, string>(`could not get traveller for ID: ${id}`),
  });
}

$update;
// Function to allocate a traveller space to a client
$update;
export function addTicket(payload: TicketPayload): Result<Ticket, string> {
  try {
    // Validate the payload
    if (!payload || !payload.boarding || !payload.destination) {
      return Result.Err<Ticket, string>("Incomplete ticket information");
    }

    // Validate that the station exists
    if (stationStorage.isEmpty()) {
      return Result.Err<Ticket, string>("Station has not been initialized");
    }

    // Validate that the train exists
    const train = getTrainById(payload.train_id);
    if (train.isErr()) {
      return Result.Err<Ticket, string>(`Train not found for ID: ${payload.train_id}`);
    }

    // Validate that the traveler exists
    const traveler = getTravellerById(payload.traveller_id);
    if (traveler.isErr()) {
      return Result.Err<Ticket, string>(`Traveler not found for ID: ${payload.traveller_id}`);
    }

    const trainInstance = train.unwrap();
    const travelerInstance = traveler.unwrap();

    if (trainInstance.empty_seats < 1) {
      return Result.Err<Ticket, string>(`The train is currently full, please wait or book another one`);
    }

    // Create a new ticket
    const ticket: Ticket = {
      id: uuidv4(),
      time: payload.time,
      seat_no: trainInstance.capacity - trainInstance.empty_seats,
      boarding: payload.boarding,
      train_id: payload.train_id,
      traveller: travelerInstance,
      destination: payload.destination,
    };

    // Insert the ticket into ticketStorage
    ticketStorage.insert(ticket.id, ticket);

    // Update the empty seats in the train
    trainInstance.empty_seats -= 1;
    trainStorage.insert(trainInstance.id, trainInstance);

    return Result.Ok<Ticket, string>(ticket);
  } catch (error) {
    return Result.Err<Ticket, string>("Failed to allocate traveler space on the train");
  }
}

            // Create a new ticket
            const ticket: Ticket = {
              id: uuidv4(),
              time: payload.time,
              seat_no: train.capacity - train.empty_seats,
              boarding: payload.boarding,
              train_id: payload.train_id,
              traveller: traveller,
              destination: payload.destination,
            };

            // Insert the ticket into ticketStorage
            ticketStorage.insert(ticket.id, ticket);

            train.empty_seats -= 1;

            trainStorage.insert(train.id, train);

            return Result.Ok<Ticket, string>(ticket);
          },
          None: (): Result<Ticket, string> => {
            return Result.Err(
              `Traveller of id: ${payload.traveller_id} not found`
            );
          },
        });
      },
      None: (): Result<Ticket, string> => {
        return Result.Err(`Train of id: ${payload.train_id} not found`);
      },
    });
  } catch (error) {
    return Result.Err("Failed to allocate traveller space on the train");
  }
}

// Function to get all tickets per train
$query;
export function getTicketsPerTrain(id: string): Result<Vec<Ticket>, string> {
  try {
    const tickets = ticketStorage
      .values()
      .filter((ticket) => ticket.train_id === id);

    // Check if there are available traveller seats
    if (tickets.length === 0) {
      return Result.Err("No tickets on this train currently");
    }

    return Result.Ok(tickets);
  } catch (error) {
    return Result.Err("Failed to get tickets");
  }
}

// Function to get all tickets per traveller
$query;
export function getTicketsPerTraveller(
  id: string
): Result<Vec<Ticket>, string> {
  try {
    const tickets = ticketStorage
      .values()
      .filter((ticket) => ticket.traveller.id === id);

    // Check if there are available traveller seats
    if (tickets.length === 0) {
      return Result.Err("No tickets for this traveller currently");
    }

    return Result.Ok(tickets);
  } catch (error) {
    return Result.Err("Failed to get tickets");
  }
}

// Function to get ticket by id
$query;
export function getTicketById(id: string): Result<Ticket, string> {
  return match(ticketStorage.get(id), {
    Some: (ticket) => Result.Ok<Ticket, string>(ticket),
    None: () =>
      Result.Err<Ticket, string>(`could not get ticket for ID: ${id}`),
  });
}

// Mocking the 'crypto' object for testing purposes
globalThis.crypto = {
  // @ts-ignore
  getRandomValues: () => {
    let array = new Uint8Array(32);

    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }

    return array;
  },
};
