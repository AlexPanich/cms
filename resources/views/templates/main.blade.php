@extends('layouts.page')

@section('head')
    @parent

@endsection

@section('body')
    @include('pages.top_menu')
    <div class="container">
        <div class="col-md-3">
            @yield('site-bar')
        </div>
        <div class="col-md-9">
            @yield('content')
        </div>
    </div>
    @parent
@endsection