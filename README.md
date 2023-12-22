# Train Ticket Booking

## Overview

The TypeScript smart contract implements a system for managing a railway network with thorough validation, update, and query functionalities, including stations, trains, tickets, and travelers. The code is structured with a combination of update and query functions, employing a stable B-tree map for efficient storage of entities.

## Prerequisites

- Node
- Typescript
- DFX
- IC CDK

### Import Statement

The module begins with necessary import statements, including modules from the "azle" library for blockchain-related functionality and the "uuid" library for generating unique identifiers.

### Type Definitions

The code defines TypeScript types for key entities:

- **Station:** Represents a station with a unique ID and a reference to the station's principal (using the "azle" library's Principal type).
- **Train:** Represents a train with attributes such as capacity, remaining empty seats, departure time, starting point, and stops.
- **Ticket:** Represents a ticket with details like ID, departure time, seat number, associated train, traveler information, boarding and destination stations.
- **Traveller:** Represents a traveler with a unique ID, name, and phone number.
- **Payload Types:** Define payload types used for creating or updating entities.

### Storage Instanc

Instances of `StableBTreeMap` are created for efficient storage of stations, tickets, trains, and travelers. These data structures provide stability in the face of changes and are well-suited for blockchain environments.

### Initialization Functi

The `initStation` function initializes a station, ensuring it has not been initialized before, and inserts it into the station storage. It utilizes the "azle" library's `ic.caller()` to identify the principal of the entity making the request.

#### Helper Functio

The `isStation` function checks if the entity making the request is a station by comparing the principal of the caller with the principal of the stored station.

#### Update Function

- **`addTrain`:** Adds a new train to the system after validating the request is made by a station and checking the payload for completeness.
- **`updateTrain`:** Updates the details of a train, ensuring that the caller is a station and validating the payload.
- **`addTraveller`:** Adds a new traveler to the system, validating the payload and station existence.

#### Query Function

- **`getTrainById`:** Retrieves a train by its ID.
- **`getTrainsEmptySeats`:** Retrieves trains with available empty seats.
- **`searchTrain`:** Searches for trains based on specified criteria such as time, starting point, and destination.
- **`getTravellersPerTrain`:** Retrieves a list of travelers for a given train.
- **`getTravellerById`:** Retrieves a traveler by their ID.
- **`getTicketsPerTrain`:** Retrieves tickets associated with a specific train.
- **`getTicketsPerTraveller`:** Retrieves tickets associated with a specific traveler.
- **`getTicketById`:** Retrieves a ticket by its ID.

#### Nested Matching

Some update functions, like `updateTrain` and `addTicket`, utilize nested matching to handle optional values and perform more complex logic. This adds flexibility to the system's functionality.

#### Testing Setup

The module concludes with the mocking of the `crypto` object for testing purposes, ensuring deterministic behavior in a testing environment.

Overall, this TypeScript module establishes a robust system for managing railway entities, with thorough validation, update, and query functionalities. The use of the "azle" library and thoughtful structuring contributes to the reliability and integrity of the system.

## Try it out

`dfx` is the tool you will use to interact with the IC locally and on mainnet. If you don't already have it installed:

```bash
npm run dfx_install
```

Next you will want to start a replica, which is a local instance of the IC that you can deploy your canisters to:

```bash
npm run replica_start
```

If you ever want to stop the replica:

```bash
npm run replica_stop
```

Now you can deploy your canister locally:

```bash
npm install
npm run canister_deploy_local
```

To call the methods on your canister:

```bash
npm run name_of_function
npm run name_of_function
```

Assuming you have [created a cycles wallet](https://internetcomputer.org/docs/current/developer-docs/quickstart/network-quickstart) and funded it with cycles, you can deploy to mainnet like this:

```bash
npm run canister_deploy_mainnet
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
