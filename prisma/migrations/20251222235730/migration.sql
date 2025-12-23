-- CreateTable
CREATE TABLE "messages" (
    "id" SERIAL NOT NULL,
    "sender_username" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "date" TIMESTAMP(6) NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "instagram_id" TEXT NOT NULL,
    "last_access" TIMESTAMP(6),
    "date_created" TIMESTAMP(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_access_token_key" ON "users"("access_token");

-- CreateIndex
CREATE UNIQUE INDEX "users_instagram_id_key" ON "users"("instagram_id");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "fk_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
