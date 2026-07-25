# GraphQL Example Operations

Every mutation and query in both services, ready to paste into each service's schema explorer
(`http://localhost:3001/graphql` for Auth Service, `http://localhost:3002/graphql` for Schedule
Service) or send with `curl`/Postman.

All Schedule Service operations require an `Authorization: Bearer <accessToken>` header, using the
token returned by Auth Service's `login`.

## Auth Service (`:3001/graphql`)

### register

```graphql
mutation Register {
  register(input: { email: "doctor.admin@clinic.com", password: "supersecret" }) {
    id
    email
    createdAt
  }
}
```

### login

```graphql
mutation Login {
  login(input: { email: "doctor.admin@clinic.com", password: "supersecret" }) {
    accessToken
    user {
      id
      email
    }
  }
}
```

### validateToken

Called by the Schedule Service internally, but can be called directly too:

```graphql
query ValidateToken {
  validateToken(input: { token: "<accessToken>" }) {
    valid
    userId
    email
  }
}
```

## Schedule Service (`:3002/graphql`)

Header for every request below:

```
Authorization: Bearer <accessToken>
```

### Customer

```graphql
mutation CreateCustomer {
  createCustomer(input: { name: "John Doe", email: "john@example.com" }) {
    id
    name
    email
  }
}

mutation UpdateCustomer {
  updateCustomer(id: "<customerId>", input: { name: "John A. Doe" }) {
    id
    name
    email
  }
}

query Customers {
  customers(page: 1, limit: 10) {
    total
    page
    limit
    data {
      id
      name
      email
    }
  }
}

query Customer {
  customer(id: "<customerId>") {
    id
    name
    email
  }
}

mutation DeleteCustomer {
  deleteCustomer(id: "<customerId>") {
    id
  }
}
```

### Doctor

```graphql
mutation CreateDoctor {
  createDoctor(input: { name: "Dr. Alice" }) {
    id
    name
  }
}

mutation UpdateDoctor {
  updateDoctor(id: "<doctorId>", input: { name: "Dr. Alice B." }) {
    id
    name
  }
}

query Doctors {
  doctors(page: 1, limit: 10) {
    total
    page
    limit
    data {
      id
      name
    }
  }
}

query Doctor {
  doctor(id: "<doctorId>") {
    id
    name
  }
}

mutation DeleteDoctor {
  deleteDoctor(id: "<doctorId>") {
    id
  }
}
```

### Schedule

```graphql
mutation CreateSchedule {
  createSchedule(
    input: {
      objective: "Annual checkup"
      customerId: "<customerId>"
      doctorId: "<doctorId>"
      scheduledAt: "2026-09-01T09:00:00.000Z"
    }
  ) {
    id
    objective
    scheduledAt
    customer {
      name
    }
    doctor {
      name
    }
  }
}

query Schedules {
  schedules(
    page: 1
    limit: 10
    doctorId: "<doctorId>"
    scheduledFrom: "2026-09-01T00:00:00.000Z"
    scheduledTo: "2026-09-30T23:59:59.000Z"
  ) {
    total
    page
    limit
    data {
      id
      objective
      scheduledAt
      customer {
        name
      }
      doctor {
        name
      }
    }
  }
}

query Schedule {
  schedule(id: "<scheduleId>") {
    id
    objective
    scheduledAt
    customer {
      name
      email
    }
    doctor {
      name
    }
  }
}

mutation DeleteSchedule {
  deleteSchedule(id: "<scheduleId>") {
    id
  }
}
```

### Error cases worth trying

- Calling any Schedule Service operation without the `Authorization` header → `Unauthorized`.
- `createSchedule` with a `doctorId`/`customerId` that doesn't exist → `Not Found`.
- `createSchedule` twice with the same `doctorId` and `scheduledAt` → `Conflict` (doctor already
  booked at that time).
- `createCustomer`/`register` with an email that's already registered → `Conflict`.
