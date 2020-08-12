# Cambria

Cambria is a general-purpose lens library for interoperating between different JSON structures.

It is based on the theory of edit lenses, for converting _patches_ on one document
to _patches_ on another document with a different structure.

In addition to converting patches, you can also convert whole documents,
simply by representing a doc as a series of patches that creates the document.

## Use cases

* Use with Chitin, a storage management library for storing documents containing data
  from multiple schemas.
* Handle change in a cloud API (either on the server or consumer side) by mapping API requests/
  responses to a different format

## Test cases

Basic tests: `$ ts-node tests/basic.ts`

Stub Chitin implementation: `$ ts-node tests/chitin.ts`
These tests use a pre-compiled set of Chitin lenses;
next steps here are:

1) think about optimizations to the compiled lenses
2) actually make the chitin compiler


## How it works with Chitin

Chitin takes a set of _source lenses_ from the user. These sources define conversions between different typed schemas: eg, between ProjectV1 and ProjectV2, or between ProjectV2 and HasTitle.

Chitin then computes a set of _compiled lenses_ based on these source lenses.
These compiled lenses define how to read/write an underlying "soup doc"
through the lens of a given schema.

Chitin internally handles optimizing these compiled lenses to efficiently
store and route the data; the user only needs to provide the source lenses
which define the essence of the conversions.

```
  ┌──────────────────┐               ┌─────────────────────────┐        
  │  Source lenses:  │               │ Compiled Chitin lenses  │        
  └──────────────────┘               └─────────────────────────┘        
                                                                        
 ProjectV1                                                              
      ▲                                      ProjectV2                  
      │                                           ▲                     
      │         HasTitle        ProjectV1         │           HasTitle  
      ▼             ▲                ▲            │               ▲     
  ProjectV2◀────────┘                │            ▼               │     
      ▲                              │ ┌─────────────────────┐    │     
      │                              └▶│ Combined "soup doc" │◀───┘     
      ▼                                └─────────────────────┘          
 ProjectV3                                        ▲                     
                                                  │                     
                                                  ▼                     
                                             ProjectV3                  
```
