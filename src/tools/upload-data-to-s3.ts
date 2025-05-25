import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import * as path from 'path';
import minimist from 'minimist';
import { S3 } from '../utils/S3';

const argv = minimist(process.argv.slice(2));
console.log("Arguments:", argv);

try {
    
    const eventId = argv.eventId;
    if (!eventId) {
        console.error("Please provide an event ID using --eventId");
        process.exit(1);
    }

    if (!existsSync("data/events/index.json")) {
        console.error("Events index does not exist!");
        process.exit(1);
    }
    if (!existsSync(`data/events/${eventId}`)) {
        console.error(`Event ID ${eventId} folder does not exist!`);
        process.exit(1);
    }
    if (
        !existsSync(`data/events/${eventId}/booths.json`)
    ) {
        console.error(`Event ID ${eventId} is missing required files!`);
        process.exit(1);
    }

    JSON.parse(
        readFileSync(`data/events/index.json`, 'utf-8')
    );
    JSON.parse(
        readFileSync(`data/events/${eventId}/booths.json`, 'utf-8')
    );
    console.log("Event data is valid.");

    await S3.uploadFile(
        path.resolve("data/events/index.json"),
        "events/index.json"
    );
    await S3.uploadFile(
        path.resolve(`data/events/${eventId}/booths.json`),
        `events/${eventId}/booths.json`
    );

    console.log(`Successfully uploaded data for event ID ${eventId} to S3.`);

} catch (error) {

    console.error("Something went wrong:", error);
    process.exit(1);

}
