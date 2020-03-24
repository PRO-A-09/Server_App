import {SocketConfig, logger} from './config.js'
import {DebateManager} from "./debatemanager.js";

const debateManager = new DebateManager();
debateManager.start();
