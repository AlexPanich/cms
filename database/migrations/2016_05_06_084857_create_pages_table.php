<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreatePagesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('pages', function (Blueprint $table) {
            $table->increments('id');
            $table->integer('parent_id')->unsigned();
            $table->string('url');
            $table->string('full_url')->unique();
            $table->string('title');
            $table->string('title_in_menu');
            $table->string('keywords');
            $table->string('description');
            $table->boolean('is_show')->default(1);
            $table->integer('menu_id')->unsigned();
            $table->integer('children_sort')->default(0);
            $table->text('content');
            $table->integer('template_id')->unsigned()->default(1);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::drop('pages');
    }
}
