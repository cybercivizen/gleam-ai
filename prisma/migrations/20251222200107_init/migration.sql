-- CreateTable
CREATE TABLE "messages" (
    "id" SERIAL NOT NULL,
    "sender_username" TEXT,
    "content" TEXT,
    "date" TIMESTAMP(6),
    "user_id" INTEGER,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" TEXT,
    "access_token" TEXT,
    "last_access" TIMESTAMP(6),
    "date_created" TIMESTAMP(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "fk_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
