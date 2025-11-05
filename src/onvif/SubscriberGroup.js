import logger from '../Logger';
import Subscriber from './Subscriber';

const NO_OP = () => {};

const NAMESPACE_DELIMITER = ':';

export const CALLBACK_TYPES = {
  motion: 'onMotionDetected',
  motionRegion: 'onMotionRegionDetected',
  motionVideo: 'onMotionVideoDetected',
  people: 'onPeopleDetected',
  animal: 'onAnimalDetected',
  vehicle: 'onVehicleDetected',
//  face: 'onFaceDetected',
//  visitor: 'onVisitorDetected',
};

const EVENTS = {
  'RuleEngine/MotionRegionDetector/Motion': CALLBACK_TYPES.motionRegion,
  'RuleEngine/MotionRegionDetector/Motion//.': CALLBACK_TYPES.motionRegion,
  'RuleEngine/CellMotionDetector/Motion': CALLBACK_TYPES.motion,
  'RuleEngine/CellMotionDetector/Motion//.': CALLBACK_TYPES.motion,
  'VideoSoure/MotionAlarm': CALLBACK_TYPES.motionVideo,
  'VideoSource/MotionAlarm': CALLBACK_TYPES.motionVideo,
  'RuleEngine/MyRuleDetector/PeopleDetect': CALLBACK_TYPES.people,
  'RuleEngine/MyRuleDetector/DogCatDetect': CALLBACK_TYPES.animal,
  'RuleEngine/MyRuleDetector/VehicleDetect': CALLBACK_TYPES.vehicle,
//  'RuleEngine/MyRuleDetector/FaceDetect': CALLBACK_TYPES.face,
//  'RuleEngine/MyRuleDetector/Visitor': CALLBACK_TYPES.visitor,
};

const DEFAULT_CALLBACKS = {
  [CALLBACK_TYPES.motion]: NO_OP,
  [CALLBACK_TYPES.motionRegion]: NO_OP,
  [CALLBACK_TYPES.motionVideo]: NO_OP,
  [CALLBACK_TYPES.people]: NO_OP,
  [CALLBACK_TYPES.animal]: NO_OP,
  [CALLBACK_TYPES.vehicle]: NO_OP,
//  [CALLBACK_TYPES.face]: NO_OP,
//  [CALLBACK_TYPES.visitor]: NO_OP,
};

export default class SubscriberGroup {
  subscribers = [];

  constructor(callbacks) {
    this.callbacks = {
      ...DEFAULT_CALLBACKS,
      ...callbacks
    };
    this.logger = logger.child({ name: 'ONVIF' });
  }

  withCallback = (callbackType, callback) => {
    this.callbacks = {
      ...this.callbacks,
      [callbackType]: callback,
    };
  };

  addSubscriber = (subscriberConfig) => {
    this.subscribers.push(new Subscriber({
      ...subscriberConfig,
      onEvent: this.onSubscriberEvent,
    }));
  };

  destroy = () => {
    this.subscribers.forEach((item) => {
      item.cam = null;
      item = null;
    });
    this.subscribers.length = 0;
  };

  _simpleItemsToObject = (items) => {
    return items.reduce((out, item) => { out[item.$.Name] = item.$.Value; return out; }, {});
  };

  onSubscriberEvent = (subscriberName, event) => {
    const [namespace, eventType] = event.topic._.split(NAMESPACE_DELIMITER);

    const callbackType = EVENTS[eventType];
    const simpleItem = event.message.message.data.simpleItem;
    const eventValue = this._simpleItemsToObject(simpleItem instanceof(Array) ? simpleItem : [simpleItem]);

    this.logger.trace('ONVIF received', { subscriberName, eventType, eventValue });

    this.callbacks[callbackType](subscriberName, eventValue);
  };
}
