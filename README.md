# Contest Base

> A database for electoral contests

A tool to keep track of keeping in touch with legislators and power brokers for serious political change.

## Installation Notes

* Default `.env` are not secure (the salt is "salt" and the reset password is password).

Copy `template.env` to `.env` and fill out the variables.

It is intended that you will use [docker](https://docs.docker.com/engine/installation/)
and [docker compose](https://docs.docker.com/compose/install/). You'll need to
copy variables.env.example to variables.env and set the values and then run the
commands below via command line to get started:

Run this command:
`docker-compose build`

Then run the container:
`docker-compose up`

Your app should be running. You can now view the logs to make sure and find the url:
`docker-compose logs --follow`

If you need terminal access inside your application (for example, to install npm dependencies):

`docker-compose exec api bash`
(Note: exec requires that we choose a service, which is why we have to specify api, which is defined in our docker/docker-compose.yml)

## Potential Problems

### Mysql auth error
If you are persisting mysql data and attempting to change connection data, it
may get unhappy. In particular if you forget to set root credentials you may get
an error about that authentication type being unsupported. If you don't have any
data yet, you can wipe the mysql directory with `sudo rm -rf mysql`. If you do
have data, you will probably need to change the credentials back, ssh into the
container, run queries to update them, exit, update the variables, and then
restart the containers again.

### Mysql no such table error
TODO: It seems when bootstrapping the repo the tables aren't already created?
This is a problem.
