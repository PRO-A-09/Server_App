import {SocketConfig, logger} from './conf/config.js'
import {DebateManager} from "./debatemanager.js";

const debateManager = new DebateManager();
debateManager.start();
