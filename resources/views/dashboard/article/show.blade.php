@extends('layouts.dashboard')

@section('page_title')
    Статьи
@endsection

@section('content_title')
    Просмотр статьи
@endsection

@section('content')
    <img src="{{ asset($article->preview->path) }}" alt="" class="img-thumbnail">
    <h2>{{ $article->title }}</h2>
    <hr>
    <article>
        {!! nl2br($article->text) !!}
    </article>
    <hr>
    <br>
    <p>
        <a class="btn btn-default btn-square" href="{{ route('all_articles') }}">Все статьи</a>
    </p>
@endsection