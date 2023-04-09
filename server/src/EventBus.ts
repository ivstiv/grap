import type { Email } from "./models/Email";
import type { EmailAddress } from "./models/EmailAddress";
import type { User } from "./models/User";

type UserRegisteredEvent = EventInit & {
  type: "UserRegistered"
  detail: {
    user: User
  }
};

type ParsedEmailEvent = EventInit & {
  type: "ParsedEmail"
  detail: {
    email: Email
  }
};

type CreateAddressEvent = EventInit & {
  type: "CreateAddress"
  detail: {
    address: EmailAddress
  }
};

type AnyEventDetail =
  | CreateAddressEvent
  | ParsedEmailEvent
  | UserRegisteredEvent;

type EventType = AnyEventDetail["type"];

type EventDetail<T extends EventType> = AnyEventDetail & { type: T};

type EventCallback<T extends EventType> = (event: EventDetail<T>) => Promise<void>;

class EventBus extends EventTarget {
  emit (event: AnyEventDetail) {
    this.dispatchEvent(new CustomEvent(event.type, event));
  }
  listen<T extends EventType> (type: T, cb: EventCallback<T>) {
    this.addEventListener(type, event =>
      void cb(event as unknown as EventDetail<T>)
        .catch(e => {
          console.log(`Event ${type} handler failed:`, e);
        }),
    );
  }
}

class CustomEvent extends Event {
  public detail: AnyEventDetail["detail"];
  constructor (message: EventType, data: AnyEventDetail) {
    super(message, data);
    this.detail = data.detail;
  }
}

export const eventBus = new EventBus();
