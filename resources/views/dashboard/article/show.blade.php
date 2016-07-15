@extends('layouts.dashboard')

@section('content')
    <img src="{{ asset($article->preview->path) }}" alt="" class="img-thumbnail">
    <h2>{{ $article->title }}</h2>
    <hr>
    <article>
        {!! nl2br($article->text) !!}
    </article>
@endsection